-- Optional future migration: store SES destination payloads as JSON instead of text arrays.
-- The application is backward-compatible: it can read text[] JSON strings or jsonb objects.
alter table public.email_jobs
  alter column destinations type jsonb
  using coalesce(array_to_json(destinations)::jsonb, '[]'::jsonb);

alter table public.email_jobs
  alter column destinations set default '[]'::jsonb;
