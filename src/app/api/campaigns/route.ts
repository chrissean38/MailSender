import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getDefaultSenderEmail() {
  return (
    process.env.DEFAULT_FROM_EMAIL ||
    process.env.SES_FROM_EMAIL ||
    process.env.MAIL_FROM_EMAIL ||
    ''
  ).trim();
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        template:email_templates(name, subject)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const campaignIds = (campaigns || []).map((campaign: any) => campaign.id);
    let jobs: any[] = [];
    if (campaignIds.length > 0) {
      const { data: jobRows, error: jobsError } = await supabase
        .from('email_jobs')
        .select('campaign_id, status')
        .in('campaign_id', campaignIds);

      if (jobsError) throw jobsError;
      jobs = jobRows || [];
    }

    const progressByCampaign = new Map<string, any>();
    for (const campaign of campaigns || []) {
      progressByCampaign.set(campaign.id, { total: 0, pending: 0, sent: 0, failed: 0, suppressed: 0, percent: 0 });
    }

    for (const job of jobs) {
      const progress = progressByCampaign.get(job.campaign_id);
      if (!progress) continue;
      progress.total += 1;
      if (job.status in progress) progress[job.status] += 1;
    }

    for (const progress of progressByCampaign.values()) {
      const finished = progress.sent + progress.failed + progress.suppressed;
      progress.percent = progress.total > 0 ? Math.round((finished / progress.total) * 100) : 0;
    }

    return NextResponse.json({
      campaigns: (campaigns || []).map((campaign: any) => {
        const progress = progressByCampaign.get(campaign.id);
        const derivedStatus = progress?.total > 0 && progress.pending === 0 ? 'completed' : campaign.status;
        return {
          ...campaign,
          status: derivedStatus,
          progress,
        };
      }),
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();

    const source = String(body.source || getDefaultSenderEmail()).trim();

    if (!body.name || !body.subject || !source || !body.template_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(source)) {
      return NextResponse.json({ error: 'Invalid source email address' }, { status: 400 });
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        subject: body.subject,
        source,
        template_id: body.template_id,
        list_id: body.list_id || null,
        status: body.status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Create campaign error:', error);
    const isBadSourceConstraint = error?.code === '23514' && String(error?.message || '').includes('campaigns_source_check');
    return NextResponse.json({
      error: isBadSourceConstraint
        ? 'Database constraint blocks sender email. Run migration 006_fix_campaign_source_sender.sql in Supabase, then try again.'
        : 'Failed to create campaign',
      details: error?.message || null,
      code: error?.code || null,
    }, { status: 500 });
  }
}
