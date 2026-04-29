import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { data: lists, error } = await supabase
      .from('contact_lists')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Get lists error:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const description = body?.description == null ? null : String(body.description);

    if (!name) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    const { data: list, error } = await supabase
      .from('contact_lists')
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ list });
  } catch (error: any) {
    console.error('Create list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create list',
        details: error?.message || null,
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}
