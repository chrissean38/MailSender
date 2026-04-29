import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .select('id, email, suppression_token')
      .eq('email', email)
      .single();

    if (error || !contact || contact.suppression_token !== token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    await supabase
      .from('contact_suppression')
      .upsert({
        email: contact.email,
        reason: 'User unsubscribe',
        source: 'manual'
      }, { onConflict: 'email' });

    await supabase
      .from('contacts')
      .update({ 
        status: 'suppressed',
        suppression_token: null
      })
      .eq('id', contact.id);

    return NextResponse.json({ 
      success: true, 
      message: 'You have been unsubscribed' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
