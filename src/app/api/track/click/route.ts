import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const campaignId = searchParams.get('campaign_id');
    const contactId = searchParams.get('contact_id');
    const messageId = searchParams.get('message_id');
    const url = searchParams.get('url');

    console.log('Click tracking:', { campaignId, contactId, url });

    if (url) {
      return NextResponse.redirect(decodeURIComponent(url), 302);
    }

    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
