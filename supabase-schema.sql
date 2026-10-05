-- Regency Events shared cloud database for the PWA
create extension if not exists pgcrypto;

create table if not exists public.regency_state (
  org_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.regency_state enable row level security;

drop policy if exists "authenticated users can read Regency state" on public.regency_state;
drop policy if exists "authenticated users can insert Regency state" on public.regency_state;
drop policy if exists "authenticated users can update Regency state" on public.regency_state;

create policy "Regency authenticated read" on public.regency_state
for select to authenticated using (true);

create policy "Regency authenticated insert" on public.regency_state
for insert to authenticated with check (true);

create policy "Regency authenticated update" on public.regency_state
for update to authenticated using (true) with check (true);

-- Enable realtime for cross-phone updates. If already enabled, this is harmless to run manually by ignoring the duplicate publication message.
do $$
begin
  alter publication supabase_realtime add table public.regency_state;
exception when duplicate_object then null;
end $$;
