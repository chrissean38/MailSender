-- Fix campaign sender storage.
-- The campaigns.source column stores the verified SES sender email address
-- (for example: no-reply@yourdomain.com). Older hardening scripts incorrectly
-- constrained it to values like template/manual/segment, which blocks campaign creation.

begin;

alter table public.campaigns drop constraint if exists campaigns_source_check;

-- Keep the column required because every campaign needs a sender for SES.
alter table public.campaigns alter column source set not null;

commit;
