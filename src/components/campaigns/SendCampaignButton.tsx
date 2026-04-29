'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

type SendCampaignButtonProps = {
    campaignId: string;
    disabled?: boolean;
};

export default function SendCampaignButton({ campaignId, disabled = false }: SendCampaignButtonProps) {
    const [isSending, setIsSending] = useState(false);
    const { showToast } = useToast();

    async function onSend() {
        if (disabled || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json?.error || 'Failed to queue campaign send');
            }

            showToast({
                type: 'success',
                title: 'Campaign queued',
                message: json?.message || 'Campaign queued successfully',
            });
        } catch (err: any) {
            showToast({
                type: 'error',
                title: 'Failed to send campaign',
                message: err?.message || 'Failed to send campaign',
            });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={onSend}
                disabled={disabled || isSending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSending ? 'Sending...' : 'Send'}
            </button>
        </div>
    );
}
