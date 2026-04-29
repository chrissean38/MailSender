import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { sanitizeTemplateHtml, htmlToPlainText } from '@/lib/template-sanitizer';

export async function GET() {
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const safeContent = sanitizeTemplateHtml(body.content || '');
    const safeContentText = String(body.content_text || '').trim() || htmlToPlainText(safeContent);

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name: body.name,
        subject: body.subject,
        content: safeContent,
        content_text: safeContentText,
        is_active: body.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
