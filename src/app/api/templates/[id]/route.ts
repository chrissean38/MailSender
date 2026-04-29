import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { sanitizeTemplateHtml, htmlToPlainText } from '@/lib/template-sanitizer';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { data: template, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error || !template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ template });
    } catch (error) {
        console.error('Get template detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const safeContent = sanitizeTemplateHtml(body.content || '');
        const safeContentText = String(body.content_text || '').trim() || htmlToPlainText(safeContent);
        const { data: template, error } = await supabase
            .from('email_templates')
            .update({
                name: body.name,
                subject: body.subject,
                content: safeContent,
                content_text: safeContentText,
                is_active: body.is_active !== false,
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ template });
    } catch (error) {
        console.error('Update template error:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}
