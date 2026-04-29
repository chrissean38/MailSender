import { getAppBaseUrl } from '@/lib/server-config';

export const dynamic = 'force-dynamic';

async function getSuppressionList() {
  const response = await fetch(`${getAppBaseUrl()}/api/suppression`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch suppression list');
  return response.json();
}

export default async function SuppressionPage() {
  const { suppression } = await getSuppressionList();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Suppression List</h1>

      <p className="text-gray-600 mb-4">
        Emails in this list will not receive any campaigns. This includes bounced emails, complaints, and manual unsubscribes.
      </p>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {suppression?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.source}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
