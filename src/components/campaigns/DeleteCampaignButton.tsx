'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

type DeleteCampaignButtonProps = {
    campaignId: string;
    campaignName?: string;
    redirectToList?: boolean;
    disabled?: boolean;
};

export default function DeleteCampaignButton({
    campaignId,
    campaignName = 'this campaign',
    redirectToList = false,
    disabled = false,
}: DeleteCampaignButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    async function onDelete() {
        if (disabled || isDeleting) return;

        const ok = window.confirm(`Delete ${campaignName}? This will also remove its queued job history. This cannot be undone.`);
        if (!ok) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || 'Failed to delete campaign');

            showToast({ type: 'success', title: 'Campaign deleted', message: 'The campaign was removed.' });
            if (redirectToList) router.push('/campaigns');
            router.refresh();
        } catch (err: any) {
            showToast({ type: 'error', title: 'Delete failed', message: err?.message || 'Could not delete campaign' });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <button
            type="button"
            onClick={onDelete}
            disabled={disabled || isDeleting}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
    );
}