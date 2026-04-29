'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

type CampaignDetailPanelProps = {
    campaignId: string;
    preflight: {
        activeContacts: number;
        suppressionCount?: number;
        sendableContacts?: number;
        canSend: boolean;
        checks: {
            hasSource: boolean;
            hasTemplate: boolean;
            hasAudience: boolean;
        };
    };
};

export default function CampaignDetailPanel({ campaignId, preflight }: CampaignDetailPanelProps) {
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState<any>(null);
    const [progressError, setProgressError] = useState('');
    const { showToast } = useToast();

    async function loadProgress() {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/progress`, { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || 'Failed to load progress');
            setProgress(json);
            setProgressError('');
        } catch (err: any) {
            setProgressError(err?.message || 'Failed to load progress');
        }
    }

    useEffect(() => {
        loadProgress();
        const timer = window.setInterval(loadProgress, 5000);
        return () => window.clearInterval(timer);
    }, [campaignId]);

    async function sendCampaign() {
        if (!preflight.canSend || isSending) return;

        setIsSending(true);

        try {
            const res = await fetch(`/api/campaigns/${campaignId}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify({}),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || 'Failed to queue campaign');

            showToast({
                type: 'success',
                title: 'Campaign queued',
                message: json?.message || 'Campaign queued successfully',
            });
            await loadProgress();
        } catch (err: any) {
            showToast({
                type: 'error',
                title: 'Send failed',
                message: err?.message || 'Send failed',
            });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Preflight Send Check</h2>
            <p className="mt-1 text-sm text-slate-600">Verify campaign readiness before queueing bulk send.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Check label="Source email configured" ok={preflight.checks.hasSource} />
                <Check label="Template assigned" ok={preflight.checks.hasTemplate} />
                <Check label="Audience available" ok={preflight.checks.hasAudience} />
            </div>

            <p className="mt-4 text-sm text-slate-700">
                Estimated recipients: <span className="font-semibold">{preflight.activeContacts}</span>
            </p>

            {typeof preflight.suppressionCount === 'number' && (
                <p className="mt-1 text-xs text-slate-500">
                    Suppressed filtered: <span className="font-semibold">{preflight.suppressionCount}</span> · Sendable:{' '}
                    <span className="font-semibold">{preflight.sendableContacts ?? preflight.activeContacts}</span>
                </p>
            )}

            <div className="mt-4 flex items-center gap-3">
                <button
                    type="button"
                    onClick={sendCampaign}
                    disabled={!preflight.canSend || isSending}
                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSending ? 'Queueing...' : 'Send to Audience'}
                </button>
                {!preflight.canSend && <span className="text-xs text-amber-600">Fix failed checks above to enable sending.</span>}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Sending Progress</h3>
                        <p className="text-xs text-slate-500">Auto-refreshes every 5 seconds while jobs are processing.</p>
                    </div>
                    <button type="button" onClick={loadProgress} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                        Refresh
                    </button>
                </div>

                {progressError && <p className="mt-3 text-xs text-rose-600">{progressError}</p>}

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress?.percent || 0}%` }} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <Metric label="Progress" value={`${progress?.percent || 0}%`} />
                    <Metric label="Total" value={progress?.counts?.total || 0} />
                    <Metric label="Pending" value={progress?.counts?.pending || 0} />
                    <Metric label="Sent" value={progress?.counts?.sent || 0} tone="success" />
                    <Metric label="Failed" value={progress?.counts?.failed || 0} tone="danger" />
                </div>

                {progress?.latestJobs?.some((job: any) => job.error) && (
                    <div className="mt-4 rounded-lg border border-rose-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Recent send errors</p>
                        <ul className="mt-2 space-y-2">
                            {progress.latestJobs.filter((job: any) => job.error).slice(0, 5).map((job: any) => (
                                <li key={job.id} className="text-xs text-rose-700">
                                    <span className="font-semibold">{job.options?.recipient_email || job.id}:</span> {job.error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}

function Metric({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'success' | 'danger' }) {
    const color = tone === 'success' ? 'text-emerald-700' : tone === 'danger' ? 'text-rose-700' : 'text-slate-900';
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
        </div>
    );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>{ok ? 'Ready' : 'Missing'}</p>
        </div>
    );
}
