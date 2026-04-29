-- Single-run bootstrap + harden script for Supabase SQL Editor
-- Creates core tables (if missing) and applies shared-team RLS hardening.

begin;

create extension if not exists "uuid-ossp";

-- ============================================================================
-- Base tables
-- ============================================================================

create table if not exists public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  subject text,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_lists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  first_name text,
  last_name text,
  list_id uuid references public.contact_lists(id) on delete set null,
  status text not null default 'active',
  suppression_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email, list_id)
);

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  source text not null,
  list_id uuid references public.contact_lists(id) on delete set null,
  template_id uuid references public.email_templates(id) on delete set null,
  status text not null default 'draft',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_segments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  filter_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_segment_contacts (
  id uuid primary key default uuid_generate_v4(),
  segment_id uuid not null references public.contact_segments(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(segment_id, contact_id)
);

create table if not exists public.contact_suppression (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  reason text not null,
  source text not null default 'auto',
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  email text not null,
  message_id text,
  event_type text not null,
  bounce_type text,
  bounce_sub_type text,
  complaint_type text,
  smtp_response text,
  url text,
  user_agent text,
  ip_address text,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_stats (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null unique references public.campaigns(id) on delete cascade,
  total_sent integer not null default 0,
  total_delivered integer not null default 0,
  total_opened integer not null default 0,
  total_clicked integer not null default 0,
  total_bounced integer not null default 0,
  total_complained integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_jobs (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  source text not null,
  destinations text[] not null,
  template_name text not null,
  template_data jsonb,
  options jsonb,
  status text not null default 'pending',
  error text,
  retry_count integer not null default 0,
  retry_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============================================================================
-- Checks / constraints
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_status_check') then
    alter table public.campaigns
      add constraint campaigns_status_check
      check (status in ('draft', 'scheduled', 'running', 'paused', 'completed', 'archived'));
  end if;

  alter table public.campaigns drop constraint if exists campaigns_source_check;

  if not exists (select 1 from pg_constraint where conname = 'contacts_status_check_v2') then
    alter table public.contacts
      add constraint contacts_status_check_v2
      check (status in ('active', 'suppressed', 'unsubscribed'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'contact_suppression_source_check') then
    alter table public.contact_suppression
      add constraint contact_suppression_source_check
      check (source in ('auto', 'manual', 'ses', 'import'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'email_events_event_type_check') then
    alter table public.email_events
      add constraint email_events_event_type_check
      check (event_type in ('bounce', 'complaint', 'delivery', 'open', 'click'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'email_jobs_status_check') then
    alter table public.email_jobs
      add constraint email_jobs_status_check
      check (status in ('pending', 'sent', 'failed', 'suppressed'));
  end if;
end $$;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_campaigns_set_updated_at on public.campaigns;
create trigger trg_campaigns_set_updated_at before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists trg_email_templates_set_updated_at on public.email_templates;
create trigger trg_email_templates_set_updated_at before update on public.email_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_contact_lists_set_updated_at on public.contact_lists;
create trigger trg_contact_lists_set_updated_at before update on public.contact_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_contacts_set_updated_at on public.contacts;
create trigger trg_contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists trg_contact_segments_set_updated_at on public.contact_segments;
create trigger trg_contact_segments_set_updated_at before update on public.contact_segments
for each row execute function public.set_updated_at();

drop trigger if exists trg_campaign_stats_set_updated_at on public.campaign_stats;
create trigger trg_campaign_stats_set_updated_at before update on public.campaign_stats
for each row execute function public.set_updated_at();

drop trigger if exists trg_email_jobs_set_updated_at on public.email_jobs;
create trigger trg_email_jobs_set_updated_at before update on public.email_jobs
for each row execute function public.set_updated_at();

-- ============================================================================
-- Indexes
-- ============================================================================

create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_scheduled_at on public.campaigns(scheduled_at);
create index if not exists idx_campaigns_created_at on public.campaigns(created_at desc);
create index if not exists idx_campaigns_template_id on public.campaigns(template_id);
create index if not exists idx_campaigns_list_id on public.campaigns(list_id);

create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_list_id on public.contacts(list_id);
create index if not exists idx_contacts_status on public.contacts(status);
create index if not exists idx_contacts_created_at on public.contacts(created_at desc);

create index if not exists idx_contact_suppression_email on public.contact_suppression(email);

create index if not exists idx_email_events_email on public.email_events(email);
create index if not exists idx_email_events_campaign_id on public.email_events(campaign_id);
create index if not exists idx_email_events_contact_id on public.email_events(contact_id);
create index if not exists idx_email_events_event_type on public.email_events(event_type);
create index if not exists idx_email_events_created_at on public.email_events(created_at);
create index if not exists idx_email_events_message_id on public.email_events(message_id)
  where message_id is not null;

create index if not exists idx_email_jobs_status on public.email_jobs(status);
create index if not exists idx_email_jobs_created_at on public.email_jobs(created_at);
create index if not exists idx_email_jobs_campaign_status on public.email_jobs(campaign_id, status);
create index if not exists idx_email_jobs_retry_after on public.email_jobs(retry_after)
  where retry_after is not null;

create index if not exists idx_contact_segment_contacts_contact_id
  on public.contact_segment_contacts(contact_id);

-- ============================================================================
-- RLS policies (shared team)
-- ============================================================================

alter table public.campaigns enable row level security;
alter table public.email_templates enable row level security;
alter table public.contact_lists enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_segments enable row level security;
alter table public.contact_segment_contacts enable row level security;
alter table public.contact_suppression enable row level security;
alter table public.email_events enable row level security;
alter table public.campaign_stats enable row level security;
alter table public.email_jobs enable row level security;

-- helper block to (re)create common authenticated policies per table
do $$
declare
  t text;
begin
  foreach t in array array[
    'campaigns','email_templates','contact_lists','contacts',
    'contact_segments','contact_segment_contacts',
    'contact_suppression','email_events','campaign_stats','email_jobs'
  ]
  loop
    execute format('drop policy if exists %I_auth_select on public.%I', t, t);
    execute format('create policy %I_auth_select on public.%I for select to authenticated using (true)', t, t);

    execute format('drop policy if exists %I_auth_insert on public.%I', t, t);
    execute format('create policy %I_auth_insert on public.%I for insert to authenticated with check (true)', t, t);
  end loop;

  -- update policies where applicable
  foreach t in array array[
    'campaigns','email_templates','contact_lists','contacts',
    'contact_segments','contact_suppression','campaign_stats','email_jobs'
  ]
  loop
    execute format('drop policy if exists %I_auth_update on public.%I', t, t);
    execute format('create policy %I_auth_update on public.%I for update to authenticated using (true) with check (true)', t, t);
  end loop;

  -- delete policies where applicable
  foreach t in array array[
    'campaigns','email_templates','contact_lists','contacts',
    'contact_segments','contact_segment_contacts','contact_suppression','email_jobs'
  ]
  loop
    execute format('drop policy if exists %I_auth_delete on public.%I', t, t);
    execute format('create policy %I_auth_delete on public.%I for delete to authenticated using (true)', t, t);
  end loop;
end $$;

commit;
