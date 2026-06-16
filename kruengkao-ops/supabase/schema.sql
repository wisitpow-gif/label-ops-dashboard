-- ============================================================================
-- ครึ่งเก้า — Label Ops · Supabase (PostgreSQL) schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Safe to run on a fresh project; re-running drops & recreates the app tables.
-- ============================================================================

-- gen_random_uuid() is built in on Supabase, but ensure pgcrypto just in case.
create extension if not exists pgcrypto;

-- Clean slate (children first because of FKs) -------------------------------
drop view  if exists public.tasks_with_schedule;
drop table if exists public.royalty_splits;
drop table if exists public.production_expenses;
drop table if exists public.tasks;
drop table if exists public.projects;

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- projects   (Blueprint Part 5: PROJECTS)
-- ----------------------------------------------------------------------------
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  song_title    text not null,
  artist        text not null,
  label         text not null,                 -- BRIDGE / MACHg / 9Arkkhan
  release_date  date not null,
  isrc_code     text,                          -- optional (Blueprint Part 5)
  drive_folder_url text,                        -- optional asset folder link
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- tasks   (Workback sub-tasks)
-- Source of truth for scheduling is the workback offset (t_minus_days), so
-- deadlines recompute automatically when a project's release_date changes
-- (Blueprint Part 3.1). See the tasks_with_schedule view for resolved dates.
-- ----------------------------------------------------------------------------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  task_key      text,                          -- stable template key (e.g. "fullmix")
  category      text not null
                  check (category in ('Digital Distribution Pack', 'TEASER & MV')),
  task_name     text not null,
  role          text not null default 'Unassigned',  -- tier 1: department
  assigned_to   text,                          -- tier 2: person (null = unassigned)
  status        text not null default 'Not Start'
                  check (status in ('Not Start', 'WIP', 'Done', 'Blocked')),
  t_minus_days  integer not null default 0,    -- deadline = release_date - this
  duration_days integer not null default 0,    -- Gantt bar length
  blocked_by    uuid references public.tasks(id) on delete set null,
  sort_order    integer not null default 0,    -- preserve template ordering
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_blocked_by on public.tasks(blocked_by);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Resolved schedule (deadline / start_date) without denormalizing.
-- security_invoker => the querying user's RLS on the base tables applies.
create view public.tasks_with_schedule
  with (security_invoker = on) as
select
  t.*,
  (p.release_date - t.t_minus_days)                    as deadline,
  (p.release_date - t.t_minus_days - t.duration_days)  as start_date
from public.tasks t
join public.projects p on p.id = t.project_id;

-- ----------------------------------------------------------------------------
-- production_expenses   (Recoupable Ledger — Blueprint Part 4.2)
-- ----------------------------------------------------------------------------
create table public.production_expenses (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  description    text not null default '',
  payee_type     text not null default 'Individual'
                   check (payee_type in ('Individual', 'Company', 'Band')),
  payee_name     text not null default '',
  amount         numeric(12, 2) not null default 0,
  is_recoupable  boolean not null default true,
  created_at     timestamptz not null default now()
);

create index idx_expenses_project_id on public.production_expenses(project_id);

-- ----------------------------------------------------------------------------
-- royalty_splits   (SONG_SPLITS — Blueprint Part 4.3)
-- ----------------------------------------------------------------------------
create table public.royalty_splits (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  role         text not null default '',        -- Producer / Lyric / Melody / Arrange
  payee_type   text not null default 'Individual'
                 check (payee_type in ('Individual', 'Company', 'Band')),
  payee_name   text not null default '',
  percentage   numeric(5, 2) not null default 0  -- 0.00–100.00 (2 decimals)
                 check (percentage >= 0 and percentage <= 100),
  note         text not null default '',
  created_at   timestamptz not null default now()
);

create index idx_splits_project_id on public.royalty_splits(project_id);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- RLS is enabled below with permissive "allow all" policies so the team can
-- test immediately with the anon key. This is OPEN ACCESS — before any public
-- deploy, replace these with auth-scoped policies (e.g. using auth.uid()).
-- ============================================================================
alter table public.projects            enable row level security;
alter table public.tasks               enable row level security;
alter table public.production_expenses enable row level security;
alter table public.royalty_splits      enable row level security;

create policy "internal_all_projects"  on public.projects
  for all using (true) with check (true);
create policy "internal_all_tasks"     on public.tasks
  for all using (true) with check (true);
create policy "internal_all_expenses"  on public.production_expenses
  for all using (true) with check (true);
create policy "internal_all_splits"    on public.royalty_splits
  for all using (true) with check (true);
