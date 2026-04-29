import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getCampaignAnalytics(campaignId: string) {
  const response = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId }),
  });
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { campaignId: string } }) {
  const campaignId = searchParams?.campaignId;
  const { analytics } = campaignId ? await getCampaignAnalytics(campaignId) : { analytics: null };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      {campaignId && analytics ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sent</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{analytics.total_sent}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Select a campaign to view its analytics.</p>
          <Link href="/campaigns" className="text-blue-600 hover:text-blue-900">View Campaigns</Link>
        </div>
      )}
    </div>
  );
}
