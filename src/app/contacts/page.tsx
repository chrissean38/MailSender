import { redirect } from 'next/navigation';
import { getAppBaseUrl } from '@/lib/server-config';

export const dynamic = 'force-dynamic';

async function getLists() {
    try {
        const response = await fetch(`${getAppBaseUrl()}/api/lists`, { cache: 'no-store' });
        if (!response.ok) return { lists: [] };
        return response.json();
    } catch {
        return { lists: [] };
    }
}

async function getListCounts() {
    try {
        const response = await fetch(`${getAppBaseUrl()}/api/contacts`, { cache: 'no-store' });
        if (!response.ok) return new Map<string, number>();
        const { contacts = [] } = await response.json();
        const counts = new Map<string, number>();
        contacts.forEach((contact: any) => {
            if (contact.list_id) counts.set(contact.list_id, (counts.get(contact.list_id) || 0) + 1);
        });
        return counts;
    } catch {
        return new Map<string, number>();
    }
}

export default async function ContactsPage({ searchParams }: { searchParams?: { saved?: string; added?: string; error?: string } }) {
    const { lists = [] } = await getLists();
    const counts = await getListCounts();

    async function saveAudience(formData: FormData) {
        'use server';
        const response = await fetch(`${getAppBaseUrl()}/api/lists/save-with-contacts`, { method: 'POST', body: formData });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) redirect(`/contacts?error=${encodeURIComponent(result?.error || 'Failed to save list')}`);
        redirect(`/contacts?saved=${encodeURIComponent(result?.list?.name || 'List')}&added=${result?.added || 0}`);
    }

    return (
        <div className="min-h-screen">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-slate-900">Contacts & Lists</h1>
                    <p className="mt-1 text-sm text-slate-600">Create a list by name, add one lead, import many leads, then select that list on a campaign.</p>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {searchParams?.saved && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Saved <strong>{searchParams.saved}</strong>. Added/updated {searchParams.added || 0} contact{searchParams.added === '1' ? '' : 's'}.</div>}
                {searchParams?.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.error}</div>}

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Create / Update List & Add Leads</h2>
                        <p className="mt-1 text-sm text-slate-500">No dropdown needed here. Type the list name once, optionally add one email and/or upload a CSV/TXT file, then save.</p>
                    </div>

                    <form action={saveAudience} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="grid gap-1 text-sm">
                                <span className="font-medium text-slate-700">List Name <span className="text-red-500">*</span></span>
                                <input type="text" name="list_name" required className="rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Newsletter Leads" list="existing-lists" />
                                <datalist id="existing-lists">{lists.map((list: any) => <option key={list.id} value={list.name} />)}</datalist>
                            </label>
                            <label className="grid gap-1 text-sm">
                                <span className="font-medium text-slate-700">Description</span>
                                <input type="text" name="description" className="rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Optional description" />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-semibold text-slate-900">Add one contact</h3>
                                <p className="mt-1 text-xs text-slate-500">Optional quick manual entry.</p>
                                <div className="mt-4 space-y-4">
                                    <label className="grid gap-1 text-sm"><span className="font-medium text-slate-700">Email Address</span><input type="email" name="email" className="rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="john@example.com" /></label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="grid gap-1 text-sm"><span className="font-medium text-slate-700">First Name</span><input type="text" name="first_name" className="rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="John" /></label>
                                        <label className="grid gap-1 text-sm"><span className="font-medium text-slate-700">Last Name</span><input type="text" name="last_name" className="rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Doe" /></label>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-semibold text-slate-900">Import many contacts</h3>
                                <p className="mt-1 text-xs text-slate-500">Optional. CSV should include an email column. TXT can be one email per line.</p>
                                <div className="mt-4 space-y-3">
                                    <input type="file" name="file" accept=".csv,.txt,text/csv,text/plain" className="w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
                                    <div className="rounded-lg bg-white p-3 text-xs text-slate-600">Supported CSV: <code>email,first_name,last_name</code></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                            <p className="text-sm text-slate-500">After saving, this list automatically appears in the Campaign contact-list dropdown.</p>
                            <button type="submit" className="inline-flex justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Save List & Leads</button>
                        </div>
                    </form>
                </section>

                <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Saved Contact Lists</h2>
                    <p className="mt-1 text-sm text-slate-500">These are the lead lists available when creating a campaign.</p>
                    <div className="mt-4 overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Contacts</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Description</th><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th></tr></thead><tbody className="divide-y divide-slate-200 bg-white">{lists.map((list: any) => <tr key={list.id}><td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{list.name}</td><td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{counts.get(list.id) || 0}</td><td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{list.description || '—'}</td><td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{new Date(list.created_at).toLocaleDateString()}</td></tr>)}{!lists.length && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">No lists yet. Create your first list above.</td></tr>}</tbody></table></div>
                </section>
            </main>
        </div>
    );
}
