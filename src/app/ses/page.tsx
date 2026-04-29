'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

type ConnectionData = {
    region: string;
    sendingEnabled: boolean;
    quota: {
        max24HourSend: number;
        maxSendRate: number;
        sentLast24Hours: number;
    };
};

export default function SesSettingsPage() {
    const { showToast } = useToast();
    const [loadingConnection, setLoadingConnection] = useState(false);
    const [connectionData, setConnectionData] = useState<ConnectionData | null>(null);

    const [sending, setSending] = useState(false);

    const [form, setForm] = useState({
        fromEmail: '',
        toEmail: '',
        subject: 'MailSender SES test email',
        message: 'Hello! This is a test email sent from your MailSender SES console.',
    });

    async function onTestConnection() {
        setLoadingConnection(true);

        try {
            const res = await fetch('/api/ses/test-connection');
            const json = await res.json();

            if (!res.ok || !json?.success) {
                throw new Error(json?.error || 'Failed to test SES connection');
            }

            setConnectionData(json.data);
            showToast({ type: 'success', title: 'SES connection successful.' });
        } catch (error: any) {
            setConnectionData(null);
            showToast({ type: 'error', title: error?.message || 'Connection test failed' });
        } finally {
            setLoadingConnection(false);
        }
    }

    async function onSendTestEmail(e: React.FormEvent) {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch('/api/ses/send-test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const json = await res.json();

            if (!res.ok || !json?.success) {
                throw new Error(json?.error || 'Failed to send test email');
            }

            showToast({
                type: 'success',
                title: 'Test email queued successfully.',
                message: `Message ID: ${json?.data?.messageId || 'N/A'}`,
            });
        } catch (error: any) {
            showToast({ type: 'error', title: error?.message || 'Test email failed' });
        } finally {
            setSending(false);
        }
    }

    const usagePercent = useMemo(() => {
        if (!connectionData || connectionData.quota.max24HourSend <= 0) return 0;
        return Math.min(
            100,
            Math.round((connectionData.quota.sentLast24Hours / connectionData.quota.max24HourSend) * 100)
        );
    }, [connectionData]);

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Amazon SES Console</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Connect your AWS SES account, inspect sending limits, and run delivery tests.
                        </p>
                    </div>
                    <button
                        onClick={onTestConnection}
                        disabled={loadingConnection}
                        className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loadingConnection ? 'Testing...' : 'Test SES Connection'}
                    </button>
                </div>

                {connectionData && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Region</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{connectionData.region}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Sending Enabled</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {connectionData.sendingEnabled ? 'Yes' : 'No'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">24h Quota</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {connectionData.quota.sentLast24Hours.toLocaleString()} /{' '}
                                {connectionData.quota.max24HourSend.toLocaleString()}
                            </p>
                        </div>

                        <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                                <span>Quota usage</span>
                                <span>{usagePercent}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Send Test Email</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Send a live test through your configured SES account to verify end-to-end deliverability.
                </p>

                <form onSubmit={onSendTestEmail} className="mt-6 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-1 text-sm">
                            <span className="font-medium text-slate-700">From email</span>
                            <input
                                required
                                type="email"
                                value={form.fromEmail}
                                onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
                                placeholder="verified-sender@yourdomain.com"
                                className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring"
                            />
                        </label>

                        <label className="grid gap-1 text-sm">
                            <span className="font-medium text-slate-700">To email</span>
                            <input
                                required
                                type="email"
                                value={form.toEmail}
                                onChange={(e) => setForm((prev) => ({ ...prev, toEmail: e.target.value }))}
                                placeholder="you@example.com"
                                className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring"
                            />
                        </label>
                    </div>

                    <label className="grid gap-1 text-sm">
                        <span className="font-medium text-slate-700">Subject</span>
                        <input
                            required
                            type="text"
                            value={form.subject}
                            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring"
                        />
                    </label>

                    <label className="grid gap-1 text-sm">
                        <span className="font-medium text-slate-700">Message</span>
                        <textarea
                            rows={4}
                            value={form.message}
                            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring"
                        />
                    </label>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={sending}
                            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {sending ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>
                </form>

            </section>
        </div>
    );
}
