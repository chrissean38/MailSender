-- Add the selected contact list to campaigns.
-- Campaign creation and sending use campaigns.list_id to limit bulk sends
-- to the imported/selected list instead of all contacts.

begin;

alter table public.campaigns
  add column if not exists list_id uuid references public.contact_lists(id) on delete set null;

create index if not exists idx_campaigns_list_id on public.campaigns(list_id);

-- Ask Supabase/PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';

commit;
