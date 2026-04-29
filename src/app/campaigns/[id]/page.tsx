import Link from 'next/link';
import CampaignDetailPanel from '@/components/campaigns/CampaignDetailPanel';
import DeleteCampaignButton from '@/components/campaigns/DeleteCampaignButton';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

async function getCampaignDetail(id: string) {
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
            *,
            template:email_templates(id, name, subject)
        `)
        .eq('id', id)
        .single();

    if (campaignError || !campaign) throw new Error('Campaign not found');

    let contactsCountQuery = supabase.from('contacts').select('id,email', { count: 'exact' }).eq('status', 'active');
    if (campaign.list_id) {
        contactsCountQuery = contactsCountQuery.eq('list_id', campaign.list_id);
    }

    const [contactsRes, jobsRes, allJobsRes] = await Promise.all([
        contactsCountQuery,
        supabase
            .from('email_jobs')
            .select('id, status, error, created_at, completed_at')
            .eq('campaign_id', id)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase
            .from('email_jobs')
            .select('id, status, error, created_at, completed_at')
            .eq('campaign_id', id)
            .order('created_at', { ascending: false }),
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

    const allJobs = allJobsRes.data || [];
    const progress = allJobs.reduce((acc: any, job: any) => {
        acc.total += 1;
        if (job.status in acc) acc[job.status] += 1;
        return acc;
    }, { total: 0, pending: 0, sent: 0, failed: 0, suppressed: 0 });
    const finished = progress.sent + progress.failed + progress.suppressed;
    progress.percent = progress.total > 0 ? Math.round((finished / progress.total) * 100) : 0;
    const displayCampaign = {
        ...campaign,
        status: progress.total > 0 && progress.pending === 0 ? 'completed' : campaign.status,
    };

    return {
        campaign: displayCampaign,
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
        jobs: jobsRes.data || [],
        progress,
    };
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
    const { campaign, preflight, jobs, progress } = await getCampaignDetail(params.id);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Link href="/campaigns" className="text-sm text-blue-600 hover:text-blue-800">
                        ← Back to campaigns
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">{campaign.name}</h1>
                    <p className="mt-1 text-sm text-slate-600">{campaign.subject}</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {campaign.status}
                </span>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Send Analytics</h2>
                        <p className="mt-1 text-sm text-slate-600">Accepted by SES is tracked as sent; failed jobs remain visible below.</p>
                    </div>
                    <DeleteCampaignButton
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                        redirectToList
                        disabled={campaign.status === 'running' || progress.pending > 0}
                    />
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${progress.failed > 0 ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${progress.percent}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
                    <AnalyticsMetric label="Progress" value={`${progress.percent}%`} />
                    <AnalyticsMetric label="Total" value={progress.total} />
                    <AnalyticsMetric label="Pending" value={progress.pending} />
                    <AnalyticsMetric label="Sent" value={progress.sent} tone="success" />
                    <AnalyticsMetric label="Failed" value={progress.failed} tone="danger" />
                    <AnalyticsMetric label="Suppressed" value={progress.suppressed} />
                </div>
                {progress.failed > 0 && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Campaign finished with {progress.failed} failed recipient(s). The campaign status is completed because no pending jobs remain; review the Queue Monitor for errors.
                    </p>
                )}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <CampaignDetailPanel campaignId={campaign.id} preflight={preflight} />

                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Campaign Configuration</h2>
                        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Info label="Source" value={campaign.source || 'Not set'} />
                            <Info label="Template" value={campaign.template?.name || 'Not set'} />
                            <Info label="Created" value={new Date(campaign.created_at).toLocaleString()} />
                            <Info label="Started" value={campaign.started_at ? new Date(campaign.started_at).toLocaleString() : '—'} />
                        </dl>
                    </section>
                </div>

                <aside className="space-y-4">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Queue Monitor</h3>
                        {jobs?.length ? (
                            <ul className="mt-3 space-y-3">
                                {jobs.map((job: any) => (
                                    <li key={job.id} className="rounded-lg border border-slate-200 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-slate-500">{new Date(job.created_at).toLocaleString()}</span>
                                            <span className={`text-xs font-semibold ${job.status === 'sent' ? 'text-emerald-600' :
                                                job.status === 'failed' ? 'text-rose-600' :
                                                    'text-indigo-600'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        {job.error && <p className="mt-1 text-xs text-rose-600">{job.error}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">No queue activity yet for this campaign.</p>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}

function AnalyticsMetric({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'success' | 'danger' }) {
    const color = tone === 'success' ? 'text-emerald-700' : tone === 'danger' ? 'text-rose-700' : 'text-slate-900';
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
        </div>
    );
}
