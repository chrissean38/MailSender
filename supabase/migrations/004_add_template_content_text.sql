-- Add optional plain-text fallback for template content
alter table public.email_templates
add column if not exists content_text text;
