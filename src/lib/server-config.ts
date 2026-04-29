const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function getRequiredEnv(name: (typeof requiredEnvVars)[number]): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

export function getSupabaseServerConfig() {
    return {
        url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
        serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    };
}

export function getAppBaseUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
}
