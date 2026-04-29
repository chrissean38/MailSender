import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const listId = searchParams.get('listId');
    const status = searchParams.get('status');

    let query = supabase.from('contacts').select('*');

    if (listId) query = query.eq('list_id', listId);
    if (status) query = query.eq('status', status);

    const { data: contacts, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
