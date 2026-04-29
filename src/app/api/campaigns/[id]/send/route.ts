import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

const CONTACT_FETCH_LIMIT = 5000;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idempotencyKey = request.headers.get('x-idempotency-key') || '';
    const campaignId = params.id;
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, source, template_id, subject, status, list_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id, name, subject, content, content_text')
      .eq('id', campaign.template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found for campaign' }, { status: 400 });
    }

    if (campaign.status === 'running') {
      return NextResponse.json({ error: 'Campaign is already running' }, { status: 409 });
    }

    const existingPendingFilter = supabase
      .from('email_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    const { count: existingPendingCount } = campaign.list_id
      ? await existingPendingFilter
      : await existingPendingFilter;

    if ((existingPendingCount || 0) > 0) {
      return NextResponse.json({ error: 'Campaign already has pending queued jobs' }, { status: 409 });
    }

    let contactsQuery = supabase
      .from('contacts')
      .select('email, first_name, last_name')
      .eq('status', 'active')
      .limit(CONTACT_FETCH_LIMIT);

    if (campaign.list_id) {
      contactsQuery = contactsQuery.eq('list_id', campaign.list_id);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) throw contactsError;

    const allContacts = contacts || [];

    const candidateEmails = allContacts
      .map((c: any) => c.email)
      .filter((e: any) => Boolean(e));

    const { data: suppressedRows } = await supabase
      .from('contact_suppression')
      .select('email')
      .in('email', candidateEmails);

    const suppressedSet = new Set((suppressedRows || []).map((row: any) => String(row.email).toLowerCase()));

    const destinations = allContacts
      .filter((contact: any) => contact.email)
      .filter((contact: any) => !suppressedSet.has(String(contact.email).toLowerCase()))
      .map((contact: any) => ({
        Destination: { ToAddresses: [contact.email] },
        ReplacementTemplateData: JSON.stringify({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.email,
          campaign_id: campaignId,
        }),
      }));

    if (destinations.length === 0) {
      return NextResponse.json({ error: 'No active contacts to send to' }, { status: 400 });
    }

    const jobsToInsert = destinations.map((destination, idx) => {
      const recipientEmail = destination.Destination.ToAddresses[0];
      const replacementData = JSON.parse(destination.ReplacementTemplateData);

      return ({
        campaign_id: campaignId,
        source: campaign.source,
        template_name: template.name,
        template_data: {
          campaign_id: campaignId,
          subject: campaign.subject,
          template_subject: template.subject,
          content: template.content,
          content_text: template.content_text,
          ...replacementData,
        },
        // Store each SES destination as a JSON string so it works with the current
        // text[] database column. The worker parses this safely before sending.
        destinations: [JSON.stringify(destination)],
        status: 'pending',
        options: {
          idempotency_key: idempotencyKey || null,
          chunk_index: idx,
          chunk_total: destinations.length,
          recipient_email: recipientEmail,
        },
        retry_count: 0,
      });
    });

    const { data: jobs, error: insertError } = await supabase
      .from('email_jobs')
      .insert(jobsToInsert)
      .select('id');

    if (insertError) throw insertError;

    await supabase
      .from('campaigns')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      jobIds: (jobs || []).map((j: any) => j.id),
      jobsQueued: jobsToInsert.length,
      destinations: destinations.length,
      message: `${destinations.length} emails queued for sending`,
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    return NextResponse.json({ error: 'Failed to schedule campaign' }, { status: 500 });
  }
}
