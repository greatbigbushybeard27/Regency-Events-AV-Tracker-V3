-- Starter schema for the future shared Regency Events AV Tracker backend.
-- Run this in the Supabase SQL editor after creating the project.
create table if not exists public.regency_state (
  org_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.regency_state enable row level security;

-- Initial authenticated-user policy. Tighten this further with an organisation-membership
-- table before using in production if multiple organisations will share the project.
create policy "authenticated users can read Regency state"
on public.regency_state for select
to authenticated
using (true);

create policy "authenticated users can insert Regency state"
on public.regency_state for insert
to authenticated
with check (true);

create policy "authenticated users can update Regency state"
on public.regency_state for update
to authenticated
using (true)
with check (true);
