import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaignId = params.id;

        const [{ data: campaign }, { data: jobs, error: jobsError }] = await Promise.all([
            supabase
                .from('campaigns')
                .select('id, status, started_at, completed_at')
                .eq('id', campaignId)
                .single(),
            supabase
                .from('email_jobs')
                .select('id, status, error, options, created_at, completed_at')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false }),
        ]);

        if (jobsError) throw jobsError;

        const counts = {
            total: jobs?.length || 0,
            pending: 0,
            sent: 0,
            failed: 0,
            suppressed: 0,
        };

        for (const job of jobs || []) {
            const status = String(job.status || 'pending') as keyof typeof counts;
            if (status in counts && status !== 'total') counts[status] += 1;
        }

        const finished = counts.sent + counts.failed + counts.suppressed;
        const percent = counts.total > 0 ? Math.round((finished / counts.total) * 100) : 0;
        const isRunning = counts.total > 0 && counts.pending > 0;
        const finalStatus = isRunning ? 'running' : counts.total > 0 ? 'completed' : campaign?.status || 'draft';

        if (campaign && campaign.status !== finalStatus && counts.total > 0) {
            await supabase
                .from('campaigns')
                .update({ status: finalStatus, ...(finalStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}) })
                .eq('id', campaignId);
        }

        return NextResponse.json({
            campaign: campaign ? { ...campaign, status: finalStatus } : null,
            counts,
            finished,
            percent,
            isRunning,
            hasFailures: counts.failed > 0,
            latestJobs: (jobs || []).slice(0, 20),
        });
    } catch (error: any) {
        console.error('Get campaign progress error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign progress', details: error?.message || null },
            { status: 500 }
        );
    }
}
