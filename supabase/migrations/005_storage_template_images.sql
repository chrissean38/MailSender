-- Template image storage bucket and public read policy
-- Run in Supabase SQL editor after confirming you want public image URLs in emails.

insert into storage.buckets (id, name, public)
values ('template-images', 'template-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read template images'
  ) then
    create policy "Public read template images"
    on storage.objects for select
    to public
    using (bucket_id = 'template-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role upload template images'
  ) then
    create policy "Service role upload template images"
    on storage.objects for insert
    to service_role
    with check (bucket_id = 'template-images');
  end if;
end $$;
