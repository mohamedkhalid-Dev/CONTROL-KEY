-- CONTROL KEY patch — 0003_custom_first
-- Run ONLY if you already ran 0001_init.sql BEFORE the custom-first fix.
-- New installs (fresh 0001) already have these columns — skip this file.
-- Paste into Supabase SQL Editor and Run.

alter table public.control_rules
  add column if not exists origin text not null default 'custom'
  check (origin in ('custom','from_template'));

alter table public.control_rules
  add column if not exists source_template_id uuid;
