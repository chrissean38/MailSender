import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaignId = params.id;

        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select(`
        *,
        template:email_templates(id, name, subject)
      `)
            .eq('id', campaignId)
            .single();

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        let contactsCountQuery = supabase.from('contacts').select('id,email', { count: 'exact' }).eq('status', 'active');
        if (campaign.list_id) {
            contactsCountQuery = contactsCountQuery.eq('list_id', campaign.list_id);
        }

        const [contactsRes, jobsRes] = await Promise.all([
            contactsCountQuery,
            supabase
                .from('email_jobs')
                .select('id, status, error, created_at, completed_at')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        const rawContacts = contactsRes.data || [];
        const rawEmails = rawContacts.map((c: any) => c.email).filter(Boolean);

        let suppressionCount = 0;
        if (rawEmails.length > 0) {
            const { count } = await supabase
                .from('contact_suppression')
                .select('id', { count: 'exact', head: true })
                .in('email', rawEmails);
            suppressionCount = count || 0;
        }

        const activeContacts = rawContacts.length;
        const sendableContacts = Math.max(activeContacts - suppressionCount, 0);
        const jobs = jobsRes.data || [];

        return NextResponse.json({
            campaign,
            preflight: {
                activeContacts,
                suppressionCount,
                sendableContacts,
                canSend: sendableContacts > 0 && Boolean(campaign.source) && Boolean(campaign.template_id),
                checks: {
                    hasSource: Boolean(campaign.source),
                    hasTemplate: Boolean(campaign.template_id),
                    hasAudience: sendableContacts > 0,
                },
            },
            jobs,
        });
    } catch (error) {
        console.error('Get campaign detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch campaign detail' }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaignId = params.id;

        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('id, status')
            .eq('id', campaignId)
            .single();

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const { count: pendingCount, error: pendingError } = await supabase
            .from('email_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('status', 'pending');

        if (pendingError) throw pendingError;

        if ((pendingCount || 0) > 0 || campaign.status === 'running') {
            return NextResponse.json(
                { error: 'Campaign is running. Wait for it to finish before deleting.' },
                { status: 409 }
            );
        }

        const { error: jobsDeleteError } = await supabase
            .from('email_jobs')
            .delete()
            .eq('campaign_id', campaignId);

        if (jobsDeleteError) throw jobsDeleteError;

        const { error: campaignDeleteError } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (campaignDeleteError) throw campaignDeleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete campaign error:', error);
        return NextResponse.json(
            { error: 'Failed to delete campaign', details: error?.message || null },
            { status: 500 }
        );
    }
}
