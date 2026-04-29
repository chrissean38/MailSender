import Link from 'next/link';
import DeleteCampaignButton from '@/components/campaigns/DeleteCampaignButton';
import SendCampaignButton from '@/components/campaigns/SendCampaignButton';
import { getAppBaseUrl } from '@/lib/server-config';

async function getCampaigns() {
  try {
    const response = await fetch(`${getAppBaseUrl()}/api/campaigns`, { cache: 'no-store' });
    if (!response.ok) return { campaigns: [] };
    const data = await response.json();
    return data;
  } catch {
    return { campaigns: [] };
  }
}

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const { campaigns = [] } = await getCampaigns();

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
            <Link href="/campaigns/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">All Campaigns</h2>
          </div>

          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {campaigns.map((campaign: any) => (
                    <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{campaign.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.status === 'draft' ? 'bg-slate-100 text-slate-800' :
                          campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {campaign.status}
                        </span>
                        {campaign.progress?.failed > 0 && (
                          <p className="mt-1 text-xs text-rose-600">{campaign.progress.failed} failed</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="min-w-[160px]">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{campaign.progress?.percent || 0}%</span>
                            <span>
                              {campaign.progress?.sent || 0}/{campaign.progress?.total || 0} sent
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${campaign.progress?.failed > 0 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                              style={{ width: `${campaign.progress?.percent || 0}%` }}
                            />
                          </div>
                          {campaign.progress?.total > 0 && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Pending {campaign.progress.pending || 0} · Failed {campaign.progress.failed || 0}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {campaign.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/campaigns/${campaign.id}`} className="text-blue-600 hover:text-blue-800">
                            View
                          </Link>
                          <SendCampaignButton
                            campaignId={campaign.id}
                            disabled={campaign.status === 'running' || campaign.status === 'completed'}
                          />
                          <DeleteCampaignButton
                            campaignId={campaign.id}
                            campaignName={campaign.name}
                            disabled={campaign.status === 'running' || (campaign.progress?.pending || 0) > 0}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-16 w-16 text-slate-300">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No campaigns yet</h3>
              <p className="mt-1 text-slate-500">Create your first email campaign to get started.</p>
              <div className="mt-6">
                <Link href="/campaigns/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Create Campaign
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
