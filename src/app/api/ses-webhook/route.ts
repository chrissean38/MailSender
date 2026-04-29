import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    if (!event || !event['Event Type']) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const eventType = event['Event Type'];
    const email = event.mail?.destination?.[0];
    const messageId = event.mail?.messageId;

    if (!email || !messageId) {
      return NextResponse.json({ error: 'Missing email or messageId' }, { status: 400 });
    }

    switch (eventType) {
      case 'Bounce':
        await handleBounce(event);
        break;
      case 'Complaint':
        await handleComplaint(event);
        break;
      case 'Delivery':
        await handleDelivery(event);
        break;
      case 'Open':
      case 'Click':
        await handleTracking(event);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SES event error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

async function handleBounce(event: any) {
  const email = event.mail.destination[0];
  const bounceType = event.bounce.bounceType;
  const bounceSubType = event.bounce.bounceSubType;

  if (bounceType === 'Permanent') {
    await supabase
      .from('contact_suppression')
      .upsert({
        email,
        reason: `Hard bounce: ${bounceSubType}`,
        source: 'ses'
      }, { onConflict: 'email' });

    await supabase
      .from('contacts')
      .update({ status: 'suppressed' })
      .eq('email', email);
  }

  await supabase
    .from('email_events')
    .insert({
      email,
      event_type: 'bounce',
      bounce_type: bounceType,
      bounce_sub_type: bounceSubType,
      message_id: event.mail.messageId
    });
}

async function handleComplaint(event: any) {
  const email = event.mail.destination[0];

  await supabase
    .from('contact_suppression')
    .upsert({
      email,
      reason: 'Complaint (spam)',
      source: 'ses'
    }, { onConflict: 'email' });

  await supabase
    .from('contacts')
    .update({ status: 'suppressed' })
    .eq('email', email);

  await supabase
    .from('email_events')
    .insert({
      email,
      event_type: 'complaint',
      complaint_type: event.complaint.complaintFeedbackType,
      message_id: event.mail.messageId
    });
}

async function handleDelivery(event: any) {
  await supabase
    .from('email_events')
    .insert({
      email: event.mail.destination[0],
      event_type: 'delivery',
      smtp_response: event.delivery?.smtpResponse,
      message_id: event.mail.messageId
    });
}

async function handleTracking(event: any) {
  await supabase
    .from('email_events')
    .insert({
      email: event.mail.destination[0],
      event_type: event['Event Type'].toLowerCase(),
      campaign_id: event.tracking?.campaignId,
      url: event.tracking?.url,
      message_id: event.mail.messageId
    });
}
