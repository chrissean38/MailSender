import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { parseContactsText } from '@/lib/contact-import';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const listId = formData.get('listId') as string;

    if (!file || !listId) {
      return NextResponse.json({ error: 'File and list ID required' }, { status: 400 });
    }

    const text = await file.text();
    const contacts = parseContactsText(text, file.name, listId);

    if (!contacts.length) {
      return NextResponse.json({ error: 'No valid contacts found in file' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contacts')
      .upsert(contacts, { onConflict: 'email,list_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, imported: contacts.length });
  } catch (error) {
    console.error('Import contacts error:', error);
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 });
  }
}
