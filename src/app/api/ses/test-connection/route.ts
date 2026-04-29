import { NextResponse } from 'next/server';
import { testSesConnection } from '@/lib/ses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await testSesConnection();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('SES connection test error:', error);

        const isKnownSesConfigOrAuthError =
            error?.name === 'SesConfigError' || error?.name === 'SesAuthError';

        return NextResponse.json(
            {
                success: false,
                error: isKnownSesConfigOrAuthError
                    ? error.message
                    : 'Failed to test SES connection',
            },
            { status: isKnownSesConfigOrAuthError ? 400 : 500 }
        );
    }
}
