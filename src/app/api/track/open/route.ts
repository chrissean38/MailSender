import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const campaignId = searchParams.get('campaign_id');
    const contactId = searchParams.get('contact_id');
    const messageId = searchParams.get('message_id');

    console.log('Open tracking:', { campaignId, contactId, messageId });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Open tracking error:', error);
    return new NextResponse('OK', { status: 200 });
  }
}
