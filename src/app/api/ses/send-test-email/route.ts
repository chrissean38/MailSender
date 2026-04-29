import { NextRequest, NextResponse } from 'next/server';
import { sendSesTestEmail } from '@/lib/ses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fromEmail = body?.fromEmail;
        const toEmail = body?.toEmail;

        if (!fromEmail || !toEmail) {
            return NextResponse.json(
                { success: false, error: 'fromEmail and toEmail are required' },
                { status: 400 }
            );
        }

        const data = await sendSesTestEmail({
            fromEmail,
            toEmail,
            subject: body?.subject,
            message: body?.message,
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('SES test send error:', error);

        const isKnownSesConfigOrAuthError =
            error?.name === 'SesConfigError' || error?.name === 'SesAuthError';

        return NextResponse.json(
            {
                success: false,
                error: isKnownSesConfigOrAuthError
                    ? error.message
                    : 'Failed to send test email',
            },
            { status: isKnownSesConfigOrAuthError ? 400 : 500 }
        );
    }
}
