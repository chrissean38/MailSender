import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { data: segments, error } = await supabase
      .from('contact_segments')
      .select(`
        *,
        contacts:contact_segment_contacts (
          contact_id
        )
      `)
      .order('created_at', { ascending: false });

    return NextResponse.json({ segments });
  } catch (error) {
    console.error('Get segments error:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: segment, error } = await supabase
      .from('contact_segments')
      .insert({
        name: body.name,
        description: body.description,
        filter_rules: body.filter_rules || []
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ segment });
  } catch (error) {
    console.error('Create segment error:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
