import Link from 'next/link';
import { getAppBaseUrl } from '@/lib/server-config';
import TemplateBuilderForm from '@/components/templates/TemplateBuilderForm';

export const dynamic = 'force-dynamic';

async function getTemplate(id: string) {
    const response = await fetch(`${getAppBaseUrl()}/api/templates/${id}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
}

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
    const { template } = await getTemplate(params.id);

    return (
        <div className="space-y-4">
            <div>
                <Link href="/templates" className="text-sm text-blue-600 hover:text-blue-800">
                    ← Back to templates
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Edit Template</h1>
                <p className="mt-1 text-sm text-slate-600">Modify content, placeholders, and preview before saving.</p>
            </div>

            <TemplateBuilderForm
                mode="edit"
                templateId={template.id}
                initialValues={{
                    name: template.name || '',
                    subject: template.subject || '',
                    content: template.content || '',
                    content_text: template.content_text || '',
                    is_active: template.is_active,
                }}
            />
        </div>
    );
}
