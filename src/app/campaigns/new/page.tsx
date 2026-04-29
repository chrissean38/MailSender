import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

function getDefaultSenderEmail() {
  return (
    process.env.DEFAULT_FROM_EMAIL ||
    process.env.SES_FROM_EMAIL ||
    process.env.MAIL_FROM_EMAIL ||
    ''
  ).trim();
}

async function getTemplates() {
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
  return { templates: templates || [] };
}

async function getLists() {
  const { data: lists, error } = await supabase
    .from('contact_lists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch lists: ${error.message}`);
  return { lists: lists || [] };
}

async function getListCounts() {
  const { data, error } = await supabase
    .from('contacts')
    .select('list_id');

  const counts = new Map<string, number>();
  if (error) return counts;

  const contacts = data || [];
  contacts.forEach((contact: any) => {
    if (contact.list_id) counts.set(contact.list_id, (counts.get(contact.list_id) || 0) + 1);
  });
  return counts;
}

export default async function NewCampaignPage({ searchParams }: { searchParams?: { error?: string } }) {
  const templates = await getTemplates();
  const lists = await getLists();
  const listCounts = await getListCounts();
  const defaultSenderEmail = getDefaultSenderEmail();

  async function createCampaign(formData: FormData) {
    'use server';

    const payload = {
      name: String(formData.get('name') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      source: String(formData.get('source') || defaultSenderEmail).trim(),
      template_id: String(formData.get('template_id') || '').trim(),
      list_id: String(formData.get('list_id') || '').trim(),
      status: 'draft',
    };

    if (!payload.name || !payload.subject || !payload.source || !payload.template_id || !payload.list_id) {
      redirect(`/campaigns/new?error=${encodeURIComponent('All campaign fields are required')}`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.source)) {
      redirect(`/campaigns/new?error=${encodeURIComponent('Invalid source email address')}`);
    }

    const { error } = await supabase
      .from('campaigns')
      .insert({
        name: payload.name,
        subject: payload.subject,
        source: payload.source,
        template_id: payload.template_id,
        list_id: payload.list_id,
        status: payload.status,
      });

    if (error) {
      redirect(`/campaigns/new?error=${encodeURIComponent(error.message || 'Failed to create campaign')}`);
    }

    redirect('/campaigns');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-gray-600 mt-2">Create a new email campaign to send to your contacts.</p>
      </div>

      {searchParams?.error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {searchParams.error}
        </div>
      )}

      <form className="bg-white shadow rounded-lg p-6 space-y-6" action={createCampaign}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="e.g., March Newsletter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email Subject</label>
          <input
            type="text"
            name="subject"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="e.g., Monthly Updates"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Send From</label>
          <input
            type="email"
            name="source"
            required={!defaultSenderEmail}
            defaultValue={defaultSenderEmail}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="verified-sender@yourdomain.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            This must be a verified Amazon SES sender email. You can set DEFAULT_FROM_EMAIL in the backend env to prefill it automatically.
          </p>
        </div>

        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Use a verified SES sender email/domain for reliable bulk sending.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email Template</label>
          <select
            name="template_id"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          >
            <option value="">Select a template</option>
            {templates?.templates?.map((template: any) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact List</label>
          <select
            name="list_id"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          >
            <option value="">Select a list</option>
            {lists?.lists?.map((list: any) => (
              <option key={list.id} value={list.id}>
                {list.name} — {listCounts.get(list.id) || 0} contacts
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
