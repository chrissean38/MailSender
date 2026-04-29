# MailSender

MailSender is a beginner-friendly email campaign manager built with **Next.js**, **Supabase**, and **Amazon SES**. It helps you manage contacts, create reusable email templates, send email campaigns, and track campaign progress from a web dashboard.

> **Security note:** Do not commit real `.env` or `.env.local` files. This repo includes `.env.example` with placeholder values so users know what settings they need without exposing private keys.

## Features

- Contact and contact list management
- CSV-style contact importing
- Email template creation and editing
- Template image uploads
- Amazon SES connection testing
- Campaign creation and sending
- Background email worker for processing send jobs
- Campaign progress tracking
- Suppression list management for unsubscribes, bounces, and complaints

## Requirements

Before using MailSender, you need:

1. **Node.js 18+**: https://nodejs.org/
2. **npm**, included with Node.js
3. A **Supabase** project: https://supabase.com/
4. An **AWS account with Amazon SES** enabled: https://aws.amazon.com/ses/
5. **Git**, if cloning from GitHub: https://git-scm.com/

## 1. Download the Project

Clone the repo:

```bash
git clone https://github.com/jackreacher-stack/MailSender.git
cd MailSender
```

Or download the ZIP from GitHub and extract it.

## 2. Install Dependencies

Run this inside the project folder:

```bash
npm install
```

This installs Next.js, React, Supabase, AWS SDK, Tailwind, and the other packages used by the app.

## 3. Create Your Environment File

Copy the safe example file into a local environment file:

```bash
copy .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace the placeholder values with your real Supabase and AWS settings.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=postgresql://user:password@host:port/database
PG_BOSS_SCHEMA=pgboss
PG_BOSS_MAX_POOL_SIZE=5
PG_BOSS_POLLING_INTERVAL=2000
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
SES_CONFIG_SET_NAME=your_ses_configuration_set_name
SES_RATE_LIMIT=1
SES_DAILY_LIMIT=200
PORT=3000
NODE_ENV=development
```

### Supabase Values

In Supabase, open your project and go to **Project Settings → API**. Copy your project URL into `NEXT_PUBLIC_SUPABASE_URL` and your service role key into `SUPABASE_SERVICE_ROLE_KEY`.

For `SUPABASE_DB_URL`, go to **Project Settings → Database**, copy the connection string, and replace the password placeholder with your real database password.

### AWS SES Values

In AWS, create or use an IAM user with SES sending permissions. Create an access key and put the values into `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Set `AWS_REGION` to your SES region, such as `us-east-1`.

If your SES account is in sandbox mode, you can only send to verified email addresses. For real campaigns, request production access from AWS SES.

## 4. Set Up the Supabase Database

Database migration files are stored in:

```text
supabase/migrations/
```

For beginners, the easiest method is to run them in the Supabase SQL Editor:

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open each file in `supabase/migrations/`.
4. Copy the SQL into the editor.
5. Run each migration in order, starting with `001_schema.sql`.

Run all migration files from oldest to newest so the database has the correct tables, indexes, storage rules, campaign fields, and email job structure.

## 5. Start the App

MailSender uses two running processes: the web app and the background worker.

### Terminal 1: Start the web app

```bash
npm run dev
```

Open this in your browser:

```text
http://localhost:3000
```

### Terminal 2: Start the worker

```bash
npm run worker
```

On Windows, you can also run:

```bash
start-worker.bat
```

The worker is important because it processes campaign send jobs.

## 6. Test Amazon SES

Go to:

```text
http://localhost:3000/ses
```

Use the SES page to test your AWS connection and send a test email. If it fails, check your AWS keys, region, verified sender address, IAM permissions, and SES sandbox status.

## 7. Add Contacts

Go to:

```text
http://localhost:3000/contacts
```

Create or import contacts. A simple CSV should look like this:

```csv
email,first_name,last_name
test@example.com,John,Doe
```

Use separate lists for different audiences, and only email people who opted in.

## 8. Create Templates

Go to:

```text
http://localhost:3000/templates
```

Create a template with a subject and body. You can use merge tags such as:

```text
{{first_name}}
{{last_name}}
{{email}}
```

Example template body:

```html
<h1>Hello {{first_name}},</h1>
<p>Thanks for joining our list.</p>
<p>Best regards,<br>Your Team</p>
```

More examples are in `docs/email-templates.md` and `docs/tracking.md`.

## 9. Create a Campaign

Go to:

```text
http://localhost:3000/campaigns
```

Create a campaign, choose the subject/template/source, select a contact list, and save it. Before sending, confirm the template, contact list, SES connection, and worker are all ready.

## 10. Send a Campaign

Open a campaign details page and click the send button. The app creates email jobs, and the worker sends them through Amazon SES.

Keep this running while sending:

```bash
npm run worker
```

If the worker is not running, campaigns may not send until you start it.

## 11. Track Campaign Progress

Open the campaign details page to view progress. Campaign statuses can include draft, running, paused, completed, and archived.

## 12. Manage Suppression

Go to:

```text
http://localhost:3000/suppression
```

Use this page to manage emails that should not receive campaigns, such as unsubscribes, complaints, bounces, and manually suppressed contacts.

## Useful Commands

```bash
npm run dev       # start development server
npm run build     # build for production
npm run start     # start production server
npm run worker    # start background worker
npm run dev:all   # helper script for local development
```

## Project Structure

```text
MailSender/
├── src/app/              # Next.js pages and API routes
├── src/components/       # Reusable UI components
├── src/lib/              # Supabase, SES, and helper libraries
├── src/styles/           # Global styles
├── docs/                 # Extra documentation
├── supabase/migrations/  # Database migration files
├── worker.js             # Background email worker
├── package.json          # npm scripts and dependencies
├── .env.example          # Safe example env file
└── README.md             # This guide
```

## Troubleshooting

### App will not start

Run `npm install`, then `npm run dev`. Confirm `.env.local` exists and has the required values.

### Supabase errors

Check your Supabase URL, service role key, database URL, and make sure every SQL migration has been run.

### SES test fails

Check AWS credentials, AWS region, verified sender email/domain, SES sandbox status, and IAM permissions.

### Campaign does not send

Make sure `npm run worker` is running, SES works, the selected list has active contacts, and the campaign is not paused or archived.

## Security Reminder

Never commit these files to GitHub:

```text
.env
.env.local
.env.*.local
```

These files can contain Supabase service keys, database passwords, AWS keys, and other secrets. Use `.env.example` for safe placeholder documentation.

## Repository

https://github.com/jackreacher-stack/MailSender
