require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!/^https:\/\//.test(supabaseUrl)) {
  console.error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const sesConfigSetName = (process.env.SES_CONFIG_SET_NAME || '').trim();

console.log('Email Worker - Starting...');
console.log('Using simple PostgreSQL-based job queue');

function normalizeDestinations(rawDestinations) {
  if (!rawDestinations) return [];
  if (Array.isArray(rawDestinations)) {
    return rawDestinations.map((item) => {
      if (typeof item === 'string') {
        try { return JSON.parse(item); } catch { return { Destination: { ToAddresses: [item] } }; }
      }
      return item;
    });
  }
  if (typeof rawDestinations === 'string') {
    try {
      const parsed = JSON.parse(rawDestinations);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [{ Destination: { ToAddresses: [rawDestinations] } }];
    }
  }
  return [rawDestinations];
}

function getRecipientEmail(destination) {
  return destination?.Destination?.ToAddresses?.[0] || destination?.ToAddresses?.[0] || destination?.email || null;
}

function renderTemplate(value, data) {
  return String(value || '').replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key) => {
    const replacement = data?.[key];
    return replacement == null ? '' : String(replacement);
  });
}

async function sendEmail(job) {
  try {
    const destinations = normalizeDestinations(job.destinations);
    if (destinations.length === 0) {
      throw new Error('Job has no destinations');
    }

    const destination = destinations[0];
    const recipientEmail = getRecipientEmail(destination);

    if (!recipientEmail) {
      throw new Error('Job destination is missing recipient email');
    }

    if (!job.source) {
      throw new Error('Job is missing source sender email');
    }

    const templateData = job.template_data || {};
    let replacementData = {};
    if (destination?.ReplacementTemplateData) {
      try { replacementData = JSON.parse(destination.ReplacementTemplateData); } catch { replacementData = {}; }
    }
    const data = { ...templateData, ...replacementData, email: recipientEmail };
    const subject = renderTemplate(data.subject || data.template_subject || job.template_name || 'Message', data);
    const html = renderTemplate(data.content || `<p>${data.content_text || ''}</p>`, data);
    const text = renderTemplate(data.content_text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), data);

    const commandInput = {
      Source: job.source,
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
      ...(sesConfigSetName ? { ConfigurationSetName: sesConfigSetName } : {}),
    };

    let response;
    try {
      response = await ses.send(new SendEmailCommand(commandInput));
    } catch (error) {
      const message = error?.message || '';
      const code = error?.name || error?.Code || '';
      if (sesConfigSetName && (code === 'ConfigurationSetDoesNotExistException' || /Configuration set .* does not exist/i.test(message))) {
        console.warn(`⚠️ SES configuration set "${sesConfigSetName}" does not exist. Retrying without configuration set.`);
        const { ConfigurationSetName, ...retryInput } = commandInput;
        response = await ses.send(new SendEmailCommand(retryInput));
      } else {
        throw error;
      }
    }
    console.log(`✅ Sent to ${recipientEmail}`);
    return response;
  } catch (error) {
    console.error('❌ SES Error:', error.message);
    throw error;
  }
}

async function processJobs() {
  // quick connectivity check so fetch/network errors are obvious
  const { error: pingError } = await supabase.from('campaigns').select('id', { head: true, count: 'exact' });
  if (pingError) {
    console.error('Supabase connectivity/query error:', pingError.message);
    return;
  }

  // Get pending jobs
  const { data: jobs, error } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('⏳ No pending jobs');
    return;
  }

  console.log(`Found ${jobs.length} pending jobs`);

  for (const job of jobs) {
    try {
      console.log(`Processing job ${job.id}...`);
      await sendEmail(job);

      // Update status
      await supabase
        .from('email_jobs')
        .update({ status: 'sent', completed_at: new Date().toISOString(), error: null })
        .eq('id', job.id);

      if (job.campaign_id) {
        await updateCampaignStatus(job.campaign_id);
      }
    } catch (err) {
      console.error(`Job ${job.id} failed:`, err.message);

      await supabase
        .from('email_jobs')
        .update({ status: 'failed', error: err.message })
        .eq('id', job.id);

      if (job.campaign_id) {
        await updateCampaignStatus(job.campaign_id);
      }
    }
  }
}

async function updateCampaignStatus(campaignId) {
  const { data: jobs, error } = await supabase
    .from('email_jobs')
    .select('status')
    .eq('campaign_id', campaignId);

  if (error) {
    console.error(`Could not update campaign ${campaignId} status:`, error.message);
    return;
  }

  const pending = (jobs || []).filter((job) => job.status === 'pending').length;

  if (pending > 0) {
    await supabase.from('campaigns').update({ status: 'running' }).eq('id', campaignId);
    return;
  }

  await supabase
    .from('campaigns')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
}

// Run immediately, then every 5 seconds
(async () => {
  console.log('Starting worker...');
  await processJobs();

  setInterval(async () => {
    await processJobs();
  }, 5000);

  console.log('Worker running. Press Ctrl+C to stop.');
})();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping worker...');
  process.exit(0);
});
