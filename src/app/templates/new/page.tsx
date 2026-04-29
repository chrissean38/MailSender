import Link from 'next/link';
import TemplateBuilderForm from '@/components/templates/TemplateBuilderForm';

export default function NewTemplatePage() {
    return (
        <div className="space-y-4">
            <div>
                <Link href="/templates" className="text-sm text-blue-600 hover:text-blue-800">
                    ← Back to templates
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">New Email Template</h1>
                <p className="mt-1 text-sm text-slate-600">Build your template with placeholders and real-time preview.</p>
            </div>

            <TemplateBuilderForm mode="create" />
        </div>
    );
}
