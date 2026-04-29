'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any;

const PLACEHOLDERS = [
    { label: 'First Name', token: '{{first_name}}' },
    { label: 'Last Name', token: '{{last_name}}' },
    { label: 'Email', token: '{{email}}' },
    { label: 'Campaign ID', token: '{{campaign_id}}' },
];

type EditorMode = 'visual' | 'html' | 'plain';

type TemplateBuilderFormProps = {
    mode: 'create' | 'edit';
    templateId?: string;
    initialValues?: {
        name: string;
        subject: string;
        content: string;
        content_text?: string;
        is_active?: boolean;
    };
};

export default function TemplateBuilderForm({ mode, templateId, initialValues }: TemplateBuilderFormProps) {
    const [form, setForm] = useState({
        name: initialValues?.name || '',
        subject: initialValues?.subject || '',
        content: initialValues?.content || '<p>Hello {{first_name}},</p><p>Welcome to our newsletter.</p>',
        content_text: initialValues?.content_text || '',
        is_active: initialValues?.is_active ?? true,
    });
    const [editorMode, setEditorMode] = useState<EditorMode>('visual');
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const quillRef = useRef<any>(null);
    const { showToast } = useToast();

    const quillModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ align: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'link', 'image'],
                ['clean'],
            ],
            handlers: { image: () => insertImageUrl() },
        },
        clipboard: { matchVisual: false },
    }), []);

    const quillFormats = [
        'font', 'size', 'header', 'bold', 'italic', 'underline', 'strike',
        'color', 'background', 'align', 'list', 'bullet', 'blockquote', 'link', 'image',
    ];

    const previewHtml = useMemo(() => form.content
        .replaceAll('{{first_name}}', 'Jane')
        .replaceAll('{{last_name}}', 'Doe')
        .replaceAll('{{email}}', 'jane@example.com')
        .replaceAll('{{campaign_id}}', 'cmp_123'), [form.content]);

    function stripHtmlToText(html: string) {
        if (typeof window !== 'undefined') {
            const div = document.createElement('div');
            div.innerHTML = html;
            return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
        }
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function getQuillEditor() {
        return quillRef.current?.getEditor?.();
    }

    function insertTextAtCursor(text: string) {
        const editor = getQuillEditor();
        if (!editor) {
            setForm((prev) => ({ ...prev, content: `${prev.content}${text}` }));
            return;
        }
        const range = editor.getSelection(true);
        const index = range?.index ?? editor.getLength();
        editor.insertText(index, text, 'user');
        editor.setSelection(index + text.length, 0, 'silent');
    }

    function insertHtmlAtCursor(html: string) {
        const editor = getQuillEditor();
        if (!editor) {
            setForm((prev) => ({ ...prev, content: `${prev.content}${html}` }));
            return;
        }
        const range = editor.getSelection(true);
        const index = range?.index ?? editor.getLength();
        editor.clipboard.dangerouslyPasteHTML(index, html, 'user');
        editor.setSelection(index + 1, 0, 'silent');
    }

    function insertPlaceholder(token: string) {
        if (editorMode === 'plain') {
            setForm((prev) => ({ ...prev, content_text: `${prev.content_text}${token}` }));
            return;
        }
        if (editorMode === 'html') {
            setForm((prev) => ({ ...prev, content: `${prev.content}${token}` }));
            return;
        }
        insertTextAtCursor(token);
    }

    function insertButtonBlock() {
        const label = window.prompt('Button text', 'Click Here');
        if (!label) return;
        const url = window.prompt('Button URL (https://...)', 'https://example.com');
        if (!url) return;
        const safeUrl = url.trim();
        if (!/^https?:\/\//i.test(safeUrl)) {
            showToast({ type: 'error', title: 'Invalid URL', message: 'Button URL must start with http:// or https://' });
            return;
        }
        insertHtmlAtCursor(`<p style="text-align:center;"><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;">${label}</a></p>`);
    }

    function insertImageUrl() {
        const imageUrl = window.prompt('Enter image URL (https://...)');
        if (!imageUrl) return;
        const safeUrl = imageUrl.trim();
        if (!/^https?:\/\//i.test(safeUrl)) {
            showToast({ type: 'error', title: 'Invalid URL', message: 'Image URL must start with http:// or https://' });
            return;
        }
        insertHtmlAtCursor(`<p><img src="${safeUrl}" alt="Image" style="max-width:100%;height:auto;" /></p>`);
    }

    function insertDivider() {
        insertHtmlAtCursor('<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />');
    }

    async function onUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/templates/upload-image', { method: 'POST', body: formData });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || 'Failed to upload image');
            insertHtmlAtCursor(`<p><img src="${json.url}" alt="Uploaded image" style="max-width:100%;height:auto;" /></p>`);
            showToast({ type: 'success', title: 'Image uploaded', message: 'Image inserted into template content.' });
        } catch (err: any) {
            showToast({ type: 'error', title: 'Upload failed', message: err?.message || 'Image upload failed' });
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const url = mode === 'create' ? '/api/templates' : `/api/templates/${templateId}`;
            const method = mode === 'create' ? 'POST' : 'PATCH';
            const contentText = form.content_text.trim() || stripHtmlToText(form.content);
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, content_text: contentText }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || 'Failed to save template');
            setForm((prev) => ({ ...prev, content_text: contentText }));
            showToast({
                type: 'success',
                title: mode === 'create' ? 'Template created' : 'Template updated',
                message: mode === 'create' ? 'Template created successfully' : 'Template updated successfully',
            });
        } catch (err: any) {
            showToast({ type: 'error', title: 'Save failed', message: err?.message || 'Save failed' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
            <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{mode === 'create' ? 'Create Template' : 'Edit Template'}</h2>
                    <p className="mt-1 text-sm text-slate-500">Compose visually like a normal email sender. Use HTML only for advanced source editing.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                        <span className="font-medium text-slate-700">Template Name</span>
                        <input required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-100 focus:border-indigo-500 focus:ring" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        <span className="font-medium text-slate-700">Subject</span>
                        <input required value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-100 focus:border-indigo-500 focus:ring" />
                    </label>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="text-sm font-medium text-slate-700">Message Body</span>
                            <p className="text-xs text-slate-500">Visual mode shows formatted text, images, colors, buttons, and layout directly.</p>
                        </div>
                        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-xs shadow-sm">
                            {(['visual', 'html', 'plain'] as EditorMode[]).map((modeName) => (
                                <button key={modeName} type="button" onClick={() => setEditorMode(modeName)} className={`rounded px-3 py-1.5 font-semibold capitalize ${editorMode === modeName ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                                    {modeName === 'plain' ? 'Plain Text' : modeName}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <select onChange={(e) => { if (e.target.value) insertPlaceholder(e.target.value); e.target.value = ''; }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700" defaultValue="">
                                <option value="" disabled>Insert placeholder</option>
                                {PLACEHOLDERS.map((item) => <option key={item.token} value={item.token}>{item.label}</option>)}
                            </select>
                            <button type="button" onClick={insertImageUrl} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100">Image URL</button>
                            <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100">
                                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" className="hidden" onChange={onUploadImage} disabled={uploadingImage} />
                            </label>
                            <button type="button" onClick={insertButtonBlock} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100">CTA Button</button>
                            <button type="button" onClick={insertDivider} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100">Divider</button>
                            <button type="button" onClick={() => setForm((prev) => ({ ...prev, content_text: stripHtmlToText(prev.content) }))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100">Generate Plain Text</button>
                        </div>

                        {editorMode === 'visual' && (
                            <div className="email-composer overflow-hidden rounded-lg border border-slate-300 bg-white">
                                <ReactQuill ref={quillRef} theme="snow" value={form.content} onChange={(value: string) => setForm((prev) => ({ ...prev, content: value }))} modules={quillModules} formats={quillFormats} placeholder="Write your email message here..." />
                            </div>
                        )}
                        {editorMode === 'html' && (
                            <textarea rows={22} value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} className="min-h-[520px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-indigo-100 focus:border-indigo-500 focus:ring" placeholder="Advanced HTML source editing" />
                        )}
                        {editorMode === 'plain' && (
                            <textarea rows={22} value={form.content_text} onChange={(e) => setForm((prev) => ({ ...prev, content_text: e.target.value }))} className="min-h-[520px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 focus:border-indigo-500 focus:ring" placeholder="Plain text fallback. If left empty, it is auto-generated from the visual/HTML message." />
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                        Active template
                    </label>
                    <button type="submit" disabled={saving} className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
                        {saving ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
                        <p className="mt-1 text-xs text-slate-500">Preview uses sample values for placeholders.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Desktop</span>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <iframe title="Template preview" className="h-[640px] w-full rounded border border-slate-200 bg-white" srcDoc={previewHtml} />
                </div>
            </section>
        </div>
    );
}
