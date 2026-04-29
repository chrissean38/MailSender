import {
    SESClient,
    SendEmailCommand,
    GetAccountSendingEnabledCommand,
    GetSendQuotaCommand,
} from '@aws-sdk/client-ses';

function getAwsCredentialStatus() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        return {
            ok: false,
            reason:
                'Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment.',
        } as const;
    }

    const isTempAccessKey = accessKeyId.startsWith('ASIA');
    const hasSessionToken = Boolean(process.env.AWS_SESSION_TOKEN);

    if (isTempAccessKey && !hasSessionToken) {
        return {
            ok: false,
            reason:
                'AWS_SESSION_TOKEN is required for temporary credentials (access keys that start with ASIA).',
        } as const;
    }

    return { ok: true } as const;
}

export class SesConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SesConfigError';
    }
}

export class SesAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SesAuthError';
    }
}

export class SesDeliveryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SesDeliveryError';
    }
}

function getSesRegion() {
    return process.env.AWS_REGION || 'us-east-1';
}

function getSesClient() {
    const credentialStatus = getAwsCredentialStatus();
    if (!credentialStatus.ok) {
        throw new SesConfigError(credentialStatus.reason);
    }

    return new SESClient({ region: getSesRegion() });
}

function normalizeSesError(error: any): never {
    const code = error?.name || error?.Code || error?.Error?.Code;
    const message = error?.message || error?.Message || '';

    if (code === 'InvalidClientTokenId' || code === 'SignatureDoesNotMatch') {
        throw new SesAuthError(
            'AWS authentication failed for SES. Verify AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN (if using temporary credentials).'
        );
    }

    if (code === 'ExpiredToken') {
        throw new SesAuthError(
            'AWS session token is expired. Refresh credentials and try again.'
        );
    }

    if (code === 'MessageRejected') {
        if (/Email address is not verified/i.test(message)) {
            throw new SesDeliveryError(
                'SES rejected the message because an email address is not verified. Verify sender identity (and recipient if your account is still in SES sandbox).'
            );
        }

        throw new SesDeliveryError(
            message ||
            'SES rejected the message. Check sender/domain verification, sandbox status, and suppression settings.'
        );
    }

    if (code === 'MailFromDomainNotVerifiedException' || code === 'ConfigurationSetDoesNotExistException') {
        throw new SesDeliveryError(
            message || 'SES configuration is invalid. Verify your SES identity and configuration set settings.'
        );
    }

    throw error;
}

export async function testSesConnection() {
    const client = getSesClient();

    let enabledRes;
    let quotaRes;

    try {
        [enabledRes, quotaRes] = await Promise.all([
            client.send(new GetAccountSendingEnabledCommand({})),
            client.send(new GetSendQuotaCommand({})),
        ]);
    } catch (error: any) {
        normalizeSesError(error);
    }

    return {
        region: getSesRegion(),
        sendingEnabled: Boolean(enabledRes.Enabled),
        quota: {
            max24HourSend: Number(quotaRes.Max24HourSend || 0),
            maxSendRate: Number(quotaRes.MaxSendRate || 0),
            sentLast24Hours: Number(quotaRes.SentLast24Hours || 0),
        },
    };
}

export async function sendSesTestEmail(params: {
    fromEmail: string;
    toEmail: string;
    subject?: string;
    message?: string;
}) {
    const client = getSesClient();

    const subject = params.subject || 'MailSender SES connection test';
    const message =
        params.message ||
        `This is a test email from MailSender at ${new Date().toISOString()}.`;

    let res;
    try {
        res = await client.send(
            new SendEmailCommand({
                Source: params.fromEmail,
                Destination: {
                    ToAddresses: [params.toEmail],
                },
                Message: {
                    Subject: {
                        Data: subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Text: {
                            Data: message,
                            Charset: 'UTF-8',
                        },
                        Html: {
                            Data: `<p>${message}</p>`,
                            Charset: 'UTF-8',
                        },
                    },
                },
            })
        );
    } catch (error: any) {
        normalizeSesError(error);
    }

    return {
        messageId: res.MessageId,
        region: getSesRegion(),
    };
}
