import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // For now, just log the data
    console.log('Email send request:', body);

    return NextResponse.json({ 
      success: true, 
      message: 'Email queued for sending' 
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
