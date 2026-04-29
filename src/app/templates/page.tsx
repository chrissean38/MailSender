import Link from 'next/link';
import { getAppBaseUrl } from '@/lib/server-config';

export const dynamic = 'force-dynamic';

async function getTemplates() {
  const response = await fetch(`${getAppBaseUrl()}/api/templates`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Link
          href="/templates/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Template
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.templates?.map((template: any) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium">{template.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
            <p className="mt-4 text-sm text-gray-600">
              {template.content.substring(0, 150)}...
            </p>
            <div className="mt-4">
              <Link
                href={`/templates/${template.id}`}
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                View Template
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
