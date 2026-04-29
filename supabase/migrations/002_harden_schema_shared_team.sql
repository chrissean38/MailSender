-- Harden MailSender schema for Supabase Cloud (shared team model)
-- Safe for environments where base tables may not exist yet.

begin;

create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  -- campaigns
  if to_regclass('public.campaigns') is not null then
    alter table public.campaigns
      alter column created_at set default now(),
      alter column updated_at set default now();

    execute 'alter table public.campaigns drop constraint if exists campaigns_source_check';

    execute 'drop trigger if exists trg_campaigns_set_updated_at on public.campaigns';
    execute 'create trigger trg_campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at()';
    execute 'create index if not exists idx_campaigns_created_at on public.campaigns(created_at desc)';
    execute 'create index if not exists idx_campaigns_template_id on public.campaigns(template_id)';
    alter table public.campaigns enable row level security;
    execute 'drop policy if exists campaigns_auth_select on public.campaigns';
    execute 'create policy campaigns_auth_select on public.campaigns for select to authenticated using (true)';
    execute 'drop policy if exists campaigns_auth_insert on public.campaigns';
    execute 'create policy campaigns_auth_insert on public.campaigns for insert to authenticated with check (true)';
    execute 'drop policy if exists campaigns_auth_update on public.campaigns';
    execute 'create policy campaigns_auth_update on public.campaigns for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists campaigns_auth_delete on public.campaigns';
    execute 'create policy campaigns_auth_delete on public.campaigns for delete to authenticated using (true)';
  end if;

  -- email_templates
  if to_regclass('public.email_templates') is not null then
    alter table public.email_templates
      alter column created_at set default now(),
      alter column updated_at set default now();
    execute 'drop trigger if exists trg_email_templates_set_updated_at on public.email_templates';
    execute 'create trigger trg_email_templates_set_updated_at before update on public.email_templates for each row execute function public.set_updated_at()';
    alter table public.email_templates enable row level security;
    execute 'drop policy if exists email_templates_auth_select on public.email_templates';
    execute 'create policy email_templates_auth_select on public.email_templates for select to authenticated using (true)';
    execute 'drop policy if exists email_templates_auth_insert on public.email_templates';
    execute 'create policy email_templates_auth_insert on public.email_templates for insert to authenticated with check (true)';
    execute 'drop policy if exists email_templates_auth_update on public.email_templates';
    execute 'create policy email_templates_auth_update on public.email_templates for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists email_templates_auth_delete on public.email_templates';
    execute 'create policy email_templates_auth_delete on public.email_templates for delete to authenticated using (true)';
  end if;

  -- contact_lists
  if to_regclass('public.contact_lists') is not null then
    alter table public.contact_lists
      alter column created_at set default now(),
      alter column updated_at set default now();
    execute 'drop trigger if exists trg_contact_lists_set_updated_at on public.contact_lists';
    execute 'create trigger trg_contact_lists_set_updated_at before update on public.contact_lists for each row execute function public.set_updated_at()';
    alter table public.contact_lists enable row level security;
    execute 'drop policy if exists contact_lists_auth_select on public.contact_lists';
    execute 'create policy contact_lists_auth_select on public.contact_lists for select to authenticated using (true)';
    execute 'drop policy if exists contact_lists_auth_insert on public.contact_lists';
    execute 'create policy contact_lists_auth_insert on public.contact_lists for insert to authenticated with check (true)';
    execute 'drop policy if exists contact_lists_auth_update on public.contact_lists';
    execute 'create policy contact_lists_auth_update on public.contact_lists for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists contact_lists_auth_delete on public.contact_lists';
    execute 'create policy contact_lists_auth_delete on public.contact_lists for delete to authenticated using (true)';
  end if;

  -- contacts
  if to_regclass('public.contacts') is not null then
    alter table public.contacts
      alter column created_at set default now(),
      alter column updated_at set default now();
    if not exists (select 1 from pg_constraint where conname = 'contacts_status_check_v2') then
      alter table public.contacts
        add constraint contacts_status_check_v2
        check (status in ('active', 'suppressed', 'unsubscribed'));
    end if;
    execute 'drop trigger if exists trg_contacts_set_updated_at on public.contacts';
    execute 'create trigger trg_contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at()';
    execute 'create index if not exists idx_contacts_status on public.contacts(status)';
    execute 'create index if not exists idx_contacts_created_at on public.contacts(created_at desc)';
    alter table public.contacts enable row level security;
    execute 'drop policy if exists contacts_auth_select on public.contacts';
    execute 'create policy contacts_auth_select on public.contacts for select to authenticated using (true)';
    execute 'drop policy if exists contacts_auth_insert on public.contacts';
    execute 'create policy contacts_auth_insert on public.contacts for insert to authenticated with check (true)';
    execute 'drop policy if exists contacts_auth_update on public.contacts';
    execute 'create policy contacts_auth_update on public.contacts for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists contacts_auth_delete on public.contacts';
    execute 'create policy contacts_auth_delete on public.contacts for delete to authenticated using (true)';
  end if;

  -- contact_segments
  if to_regclass('public.contact_segments') is not null then
    execute 'drop trigger if exists trg_contact_segments_set_updated_at on public.contact_segments';
    execute 'create trigger trg_contact_segments_set_updated_at before update on public.contact_segments for each row execute function public.set_updated_at()';
    alter table public.contact_segments enable row level security;
    execute 'drop policy if exists contact_segments_auth_select on public.contact_segments';
    execute 'create policy contact_segments_auth_select on public.contact_segments for select to authenticated using (true)';
    execute 'drop policy if exists contact_segments_auth_insert on public.contact_segments';
    execute 'create policy contact_segments_auth_insert on public.contact_segments for insert to authenticated with check (true)';
    execute 'drop policy if exists contact_segments_auth_update on public.contact_segments';
    execute 'create policy contact_segments_auth_update on public.contact_segments for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists contact_segments_auth_delete on public.contact_segments';
    execute 'create policy contact_segments_auth_delete on public.contact_segments for delete to authenticated using (true)';
  end if;

  -- contact_segment_contacts
  if to_regclass('public.contact_segment_contacts') is not null then
    execute 'create index if not exists idx_contact_segment_contacts_contact_id on public.contact_segment_contacts(contact_id)';
    alter table public.contact_segment_contacts enable row level security;
    execute 'drop policy if exists contact_segment_contacts_auth_select on public.contact_segment_contacts';
    execute 'create policy contact_segment_contacts_auth_select on public.contact_segment_contacts for select to authenticated using (true)';
    execute 'drop policy if exists contact_segment_contacts_auth_insert on public.contact_segment_contacts';
    execute 'create policy contact_segment_contacts_auth_insert on public.contact_segment_contacts for insert to authenticated with check (true)';
    execute 'drop policy if exists contact_segment_contacts_auth_delete on public.contact_segment_contacts';
    execute 'create policy contact_segment_contacts_auth_delete on public.contact_segment_contacts for delete to authenticated using (true)';
  end if;

  -- contact_suppression
  if to_regclass('public.contact_suppression') is not null then
    alter table public.contact_suppression alter column created_at set default now();
    alter table public.contact_suppression enable row level security;
    execute 'drop policy if exists contact_suppression_auth_select on public.contact_suppression';
    execute 'create policy contact_suppression_auth_select on public.contact_suppression for select to authenticated using (true)';
    execute 'drop policy if exists contact_suppression_auth_insert on public.contact_suppression';
    execute 'create policy contact_suppression_auth_insert on public.contact_suppression for insert to authenticated with check (true)';
    execute 'drop policy if exists contact_suppression_auth_update on public.contact_suppression';
    execute 'create policy contact_suppression_auth_update on public.contact_suppression for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists contact_suppression_auth_delete on public.contact_suppression';
    execute 'create policy contact_suppression_auth_delete on public.contact_suppression for delete to authenticated using (true)';
  end if;

  -- email_events
  if to_regclass('public.email_events') is not null then
    alter table public.email_events alter column created_at set default now();
    execute 'create index if not exists idx_email_events_message_id on public.email_events(message_id) where message_id is not null';
    alter table public.email_events enable row level security;
    execute 'drop policy if exists email_events_auth_select on public.email_events';
    execute 'create policy email_events_auth_select on public.email_events for select to authenticated using (true)';
    execute 'drop policy if exists email_events_auth_insert on public.email_events';
    execute 'create policy email_events_auth_insert on public.email_events for insert to authenticated with check (true)';
  end if;

  -- campaign_stats
  if to_regclass('public.campaign_stats') is not null then
    execute 'drop trigger if exists trg_campaign_stats_set_updated_at on public.campaign_stats';
    execute 'create trigger trg_campaign_stats_set_updated_at before update on public.campaign_stats for each row execute function public.set_updated_at()';
    alter table public.campaign_stats enable row level security;
    execute 'drop policy if exists campaign_stats_auth_select on public.campaign_stats';
    execute 'create policy campaign_stats_auth_select on public.campaign_stats for select to authenticated using (true)';
    execute 'drop policy if exists campaign_stats_auth_insert on public.campaign_stats';
    execute 'create policy campaign_stats_auth_insert on public.campaign_stats for insert to authenticated with check (true)';
    execute 'drop policy if exists campaign_stats_auth_update on public.campaign_stats';
    execute 'create policy campaign_stats_auth_update on public.campaign_stats for update to authenticated using (true) with check (true)';
  end if;

  -- email_jobs
  if to_regclass('public.email_jobs') is not null then
    alter table public.email_jobs
      alter column created_at set default now(),
      alter column updated_at set default now();
    execute 'drop trigger if exists trg_email_jobs_set_updated_at on public.email_jobs';
    execute 'create trigger trg_email_jobs_set_updated_at before update on public.email_jobs for each row execute function public.set_updated_at()';
    execute 'create index if not exists idx_email_jobs_campaign_status on public.email_jobs(campaign_id, status)';
    execute 'create index if not exists idx_email_jobs_retry_after on public.email_jobs(retry_after) where retry_after is not null';
    alter table public.email_jobs enable row level security;
    execute 'drop policy if exists email_jobs_auth_select on public.email_jobs';
    execute 'create policy email_jobs_auth_select on public.email_jobs for select to authenticated using (true)';
    execute 'drop policy if exists email_jobs_auth_insert on public.email_jobs';
    execute 'create policy email_jobs_auth_insert on public.email_jobs for insert to authenticated with check (true)';
    execute 'drop policy if exists email_jobs_auth_update on public.email_jobs';
    execute 'create policy email_jobs_auth_update on public.email_jobs for update to authenticated using (true) with check (true)';
    execute 'drop policy if exists email_jobs_auth_delete on public.email_jobs';
    execute 'create policy email_jobs_auth_delete on public.email_jobs for delete to authenticated using (true)';
  end if;
end $$;

commit;
