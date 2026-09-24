-- CONTROL KEY — 0005_age_any
-- Allows any age 1-120 (was 10-20). Run if you already ran 0001_init.sql.
-- Fresh installs already get 1-120 from 0001 — safe to run anyway.
-- Paste into Supabase SQL Editor and Run, or: supabase db push

alter table public.profiles drop constraint if exists profiles_age_check;
alter table public.profiles
  add constraint profiles_age_check check (age between 1 and 120);
