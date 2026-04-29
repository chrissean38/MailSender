import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');

    const { data, error } = await supabase.rpc('get_campaign_analytics', {
      campaign_id: campaignId,
    });

    if (error) throw error;

    return NextResponse.json({ analytics: data[0] || null });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    const { data, error } = await supabase.rpc('get_campaign_analytics', {
      campaign_id: campaignId,
    });

    if (error) throw error;

    return NextResponse.json({ analytics: data[0] || null });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
