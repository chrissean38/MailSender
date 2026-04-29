/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    SES_CONFIG_SET_NAME: process.env.SES_CONFIG_SET_NAME,
    SES_RATE_LIMIT: process.env.SES_RATE_LIMIT,
    SES_DAILY_LIMIT: process.env.SES_DAILY_LIMIT,
  },
};

module.exports = nextConfig;
