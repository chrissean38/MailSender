import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { data: suppression, error } = await supabase
      .from('contact_suppression')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({ suppression });
  } catch (error) {
    console.error('Get suppression error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppression list' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, reason, source } = body;

    if (!email || !reason) {
      return NextResponse.json({ error: 'Email and reason required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contact_suppression')
      .upsert({ email, reason, source: source || 'auto' }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ suppressed: data });
  } catch (error) {
    console.error('Add suppression error:', error);
    return NextResponse.json({ error: 'Failed to add to suppression' }, { status: 500 });
  }
}
