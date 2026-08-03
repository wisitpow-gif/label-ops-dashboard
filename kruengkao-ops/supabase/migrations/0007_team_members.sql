-- ============================================================================
-- team_members — DB source of truth for the Role → Person roster
-- ----------------------------------------------------------------------------
-- Replaces the static TEAM_STRUCTURE constant. A person can belong to more
-- than one role (e.g. "Ken" is both Promoter and Graphics), so the unit is a
-- (name, role) pair.
-- ============================================================================

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null,
  created_at timestamptz not null default now(),
  unique (name, role)
);

create index if not exists idx_team_members_role on public.team_members(role);

-- Auth-scoped RLS, consistent with every other app table (migration 0006).
alter table public.team_members enable row level security;
drop policy if exists authed_all_team_members on public.team_members;
create policy authed_all_team_members on public.team_members
  for all to authenticated using (true) with check (true);

-- Seed with the roster we have been using.
insert into public.team_members (name, role) values
  ('Eak', 'Promoter'), ('Jah', 'Promoter'), ('Ken', 'Promoter'), ('Lookmou', 'Promoter'),
  ('Pim', 'Creative/MarCom'), ('Aft', 'Creative/MarCom'), ('Nutt', 'Creative/MarCom'), ('Mook', 'Creative/MarCom'),
  ('Ken', 'Graphics'), ('Hem', 'Graphics'), ('Nan', 'Graphics'), ('Korn', 'Graphics'), ('Kai', 'Graphics'), ('Mill', 'Graphics'),
  ('Pakbung', 'Producer'), ('Spy', 'Producer'), ('Lookkaew', 'Producer'), ('Ayu', 'Producer'),
  ('Bomb', 'Digital')
on conflict (name, role) do nothing;
