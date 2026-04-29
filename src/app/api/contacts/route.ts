import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*, list:contact_lists(id, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let contactsPayload: any[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      contactsPayload = Array.isArray(body?.contacts) ? body.contacts : [];
    } else {
      const formData = await request.formData();
      const email = (formData.get('email') as string) || '';
      const first_name = (formData.get('first_name') as string) || null;
      const last_name = (formData.get('last_name') as string) || null;
      const list_id = (formData.get('list_id') as string) || '';

      if (!email || !list_id) {
        return NextResponse.json({ error: 'Email and list are required' }, { status: 400 });
      }

      contactsPayload = [{ email, first_name, last_name, list_id }];
    }

    if (!contactsPayload.length) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });
    }

    const { data: contacts, error } = await supabase
      .from('contacts')
      .upsert(contactsPayload, { onConflict: 'email,list_id' })
      .select('id');

    if (error) throw error;

    return NextResponse.json({ success: true, count: contacts?.length || contactsPayload.length });
  } catch (error) {
    console.error('Bulk add contacts error:', error);
    return NextResponse.json({ error: 'Failed to add contacts' }, { status: 500 });
  }
}
