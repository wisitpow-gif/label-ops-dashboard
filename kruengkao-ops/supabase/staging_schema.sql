-- ============================================================================
-- ครึ่งเก้า — Label Ops · STAGING schema (from scratch)
-- Mirrors production = base schema.sql + migrations 0001–0011.
-- Safe on a fresh project; re-running drops & recreates the app tables.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── Clean slate (children first because of FKs) ─────────────────────────────
drop view  if exists public.tasks_with_schedule;
drop table if exists public.task_dependencies;
drop table if exists public.project_assets;
drop table if exists public.production_expenses;
drop table if exists public.royalty_splits;
drop table if exists public.tasks;
drop table if exists public.task_templates;
drop table if exists public.team_members;
drop table if exists public.projects;

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── projects ────────────────────────────────────────────────────────────────
-- artist / label / release_date are nullable (Internal work omits them, 0004).
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  song_title    text not null,
  artist        text,
  label         text,                          -- BRIDGE / MACHg / 9Arkkhan
  release_date  date,
  isrc_code     text,
  drive_folder_url text,
  project_type  text not null default 'Single'
                  check (project_type in ('Single', 'Album', 'Live Session', 'Concert', 'Other')),
  work_type     text not null default 'Release'
                  check (work_type in ('Release', 'Internal')),
  target_date   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ── tasks ───────────────────────────────────────────────────────────────────
-- category is FREE TEXT (not null). Production dropped the original CHECK in
-- migration 0005 so ad-hoc categories work: 'Demo', 'Digital Distribution
-- Pack', 'TEASER & MV', 'Online Content', and 'General' (Internal tasks).
-- task_key is nullable so ad-hoc tasks (which have no template key) insert fine.
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  task_key      text,                          -- template key (null for ad-hoc)
  category      text not null,
  task_name     text not null,
  role          text not null default 'Unassigned',   -- tier 1: department
  assigned_to   text,                          -- tier 2: person name (null = unassigned)
  status        text not null default 'Not Start'
                  check (status in ('Not Start', 'WIP', 'Done', 'Blocked')),
  t_minus_days  integer not null default 0,    -- workback fallback: deadline = release_date - this
  duration_days integer not null default 0,
  due_date      date,                          -- Internal tasks schedule by this
  start_date    date,                          -- explicit stored range (wins over workback)
  end_date      date,
  blocked_by    uuid references public.tasks(id) on delete set null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- OPTIONAL guardrail — production does NOT have this (free text by design).
-- Enable ONLY if you want the DB to enforce the category set. It MUST include
-- 'General', or every Internal/Ad-Hoc task insert will fail.
-- alter table public.tasks add constraint tasks_category_check
--   check (category in ('Demo', 'Digital Distribution Pack', 'TEASER & MV', 'Online Content', 'General'));

create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_blocked_by on public.tasks(blocked_by);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Legacy resolved-schedule view. The app no longer reads it (it derives
-- deadlines itself), so this is recreated in a clash-free form: it exposes the
-- real stored columns via t.* plus a computed `deadline`. (Reproducing prod's
-- frozen `t.*` + `start_date` alias verbatim would now duplicate start_date.)
create view public.tasks_with_schedule
  with (security_invoker = on) as
select
  t.*,
  (p.release_date - t.t_minus_days) as deadline
from public.tasks t
join public.projects p on p.id = t.project_id;

-- ── task_templates (0001) ───────────────────────────────────────────────────
create table public.task_templates (
  id            uuid primary key default gen_random_uuid(),
  project_type  text not null default 'Single'
                  check (project_type in ('Single', 'Album', 'Live Session', 'Concert', 'Other')),
  task_key      text not null,
  category      text not null,                 -- free text: accepts 'Online Content'
  task_name     text not null,
  role          text not null default 'Unassigned',
  t_minus_days  integer not null default 0,
  duration_days integer not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (project_type, task_key)
);

create index idx_task_templates_project_type on public.task_templates(project_type);

create trigger trg_task_templates_updated_at
  before update on public.task_templates
  for each row execute function public.set_updated_at();

insert into public.task_templates
  (project_type, task_key, category, task_name, role, t_minus_days, duration_days, sort_order)
values
  -- Single — Digital Distribution Pack
  ('Single', 'fullmix',       'Digital Distribution Pack', 'Full Mix Audio',  'Promoter',        45, 14,  0),
  ('Single', 'minusone',      'Digital Distribution Pack', 'Minus One',       'Promoter',        40,  7,  1),
  ('Single', 'backing',       'Digital Distribution Pack', 'Backing Track',   'Promoter',        40,  7,  2),
  ('Single', 'metadata',      'Digital Distribution Pack', 'Metadata',        'Promoter',        28,  5,  3),
  ('Single', 'cover',         'Digital Distribution Pack', 'Single Cover',    'Graphics',        42, 21,  4),
  ('Single', 'artistprofile', 'Digital Distribution Pack', 'Artist Profile',  'Promoter',        35,  7,  5),
  ('Single', 'songprofile',   'Digital Distribution Pack', 'Song Profile',    'Promoter',        35,  7,  6),
  ('Single', 'tiktok',        'Digital Distribution Pack', 'Tiktok',          'Creative/MarCom', 21, 10,  7),
  ('Single', 'prphoto',       'Digital Distribution Pack', 'PR Photo',        'Graphics',        50, 10,  8),
  -- Single — TEASER & MV
  ('Single', 'shoot',         'TEASER & MV', 'ออกกอง',                'Producer', 60,  2,  9),
  ('Single', 'shootphoto',    'TEASER & MV', 'ภาพออกกอง',             'Producer', 58,  5, 10),
  ('Single', 'teasercut',     'TEASER & MV', 'TEASER Cutting Check',  'Producer', 45,  7, 11),
  ('Single', 'teasercolor',   'TEASER & MV', 'TEASER Color Check',    'Producer', 40,  5, 12),
  ('Single', 'teaserprint',   'TEASER & MV', 'TEASER Check print',    'Producer', 35,  3, 13),
  ('Single', 'mvcut',         'TEASER & MV', 'MV Cutting Check',      'Producer', 30, 10, 14),
  ('Single', 'mvcolor',       'TEASER & MV', 'MV Color Check',        'Producer', 20,  7, 15),
  ('Single', 'mvprint',       'TEASER & MV', 'MV Check print',        'Producer', 14,  3, 16),
  ('Single', 'subtitle',      'TEASER & MV', 'Subtitle',              'Producer', 10,  3, 17),
  -- Album (placeholder)
  ('Album', 'album_concept',  'Digital Distribution Pack', 'Album Concept & Tracklist', 'Promoter', 90, 14, 0),
  ('Album', 'album_master',   'Digital Distribution Pack', 'Album Master Audio',        'Producer', 60, 30, 1),
  ('Album', 'album_artwork',  'Digital Distribution Pack', 'Album Artwork',             'Graphics', 50, 21, 2),
  ('Album', 'album_metadata', 'Digital Distribution Pack', 'Album Metadata',            'Promoter', 28,  7, 3),
  ('Album', 'album_mv',       'TEASER & MV',               'Lead Single MV',            'Producer', 45, 20, 4),
  -- Live Session (placeholder)
  ('Live Session', 'live_venue', 'TEASER & MV',               'Venue & Setup Booking', 'Producer',        45,  7, 0),
  ('Live Session', 'live_shoot', 'TEASER & MV',               'Live Recording Shoot',  'Producer',        30,  2, 1),
  ('Live Session', 'live_mix',   'Digital Distribution Pack', 'Live Mix & Master',     'Producer',        20, 10, 2),
  ('Live Session', 'live_promo', 'Digital Distribution Pack', 'Promo Clips',           'Creative/MarCom', 14,  7, 3)
on conflict (project_type, task_key) do nothing;

-- ── project_assets (0003 + 0010 + 0011, final shape) ────────────────────────
create table public.project_assets (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  category            text not null default 'Uncategorized',
  note                text,                    -- short note / file name
  source_link         text,                    -- team member's temp link
  official_drive_link text,                    -- final cloud URL OR offline path
  is_backed_up_local  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_project_assets_project_id on public.project_assets(project_id);

create trigger trg_project_assets_updated_at
  before update on public.project_assets
  for each row execute function public.set_updated_at();

-- ── team_members (0007 + 0008) ──────────────────────────────────────────────
create table public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null,
  email      text,                             -- optional; links auth user → member
  created_at timestamptz not null default now(),
  unique (name, role)
);

create index idx_team_members_role on public.team_members(role);

insert into public.team_members (name, role) values
  ('Eak', 'Promoter'), ('Jah', 'Promoter'), ('Ken', 'Promoter'), ('Lookmou', 'Promoter'),
  ('Pim', 'Creative/MarCom'), ('Aft', 'Creative/MarCom'), ('Nutt', 'Creative/MarCom'), ('Mook', 'Creative/MarCom'),
  ('Ken', 'Graphics'), ('Hem', 'Graphics'), ('Nan', 'Graphics'), ('Korn', 'Graphics'), ('Kai', 'Graphics'), ('Mill', 'Graphics'),
  ('Pakbung', 'Producer'), ('Spy', 'Producer'), ('Lookkaew', 'Producer'), ('Ayu', 'Producer'),
  ('Bomb', 'Digital')
on conflict (name, role) do nothing;

-- ── task_dependencies (0004) ────────────────────────────────────────────────
create table public.task_dependencies (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at         timestamptz not null default now(),
  unique (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create index idx_task_deps_task       on public.task_dependencies(task_id);
create index idx_task_deps_depends_on on public.task_dependencies(depends_on_task_id);

-- ── production_expenses (base schema) ───────────────────────────────────────
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

-- ── royalty_splits (base schema) ────────────────────────────────────────────
create table public.royalty_splits (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  role         text not null default '',
  payee_type   text not null default 'Individual'
                 check (payee_type in ('Individual', 'Company', 'Band')),
  payee_name   text not null default '',
  percentage   numeric(5, 2) not null default 0
                 check (percentage >= 0 and percentage <= 100),
  note         text not null default '',
  created_at   timestamptz not null default now()
);

create index idx_splits_project_id on public.royalty_splits(project_id);

-- ============================================================================
-- Auth gate (0006): restrict who can sign in (Google) to an allowed domain
-- or an explicit email allowlist.
-- ============================================================================
create table if not exists public.allowed_domains ( domain text primary key );
create table if not exists public.allowed_emails  ( email  text primary key );

-- Seed the company domain. Add staging testers with:
--   insert into public.allowed_emails(email) values ('tester@example.com');
insert into public.allowed_domains(domain) values ('kruengkao.com')
  on conflict do nothing;

alter table public.allowed_domains enable row level security;
alter table public.allowed_emails  enable row level security;
-- (no policies => only the service role can read/write these lists)

create or replace function public.enforce_allowed_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  addr text := lower(new.email);
  dom  text := split_part(lower(new.email), '@', 2);
begin
  if new.email is null or dom = '' then
    raise exception 'A valid email is required to sign in';
  end if;
  if exists (select 1 from public.allowed_domains d where lower(d.domain) = dom)
     or exists (select 1 from public.allowed_emails e where lower(e.email) = addr)
  then
    return new;
  end if;
  raise exception 'not_authorized: % is not permitted to sign in', addr;
end;
$$;

drop trigger if exists trg_enforce_allowed_signup on auth.users;
create trigger trg_enforce_allowed_signup
  before insert on auth.users
  for each row execute function public.enforce_allowed_signup();

-- ============================================================================
-- Row Level Security (0006): any signed-in member can read/write everything;
-- anonymous (no session) gets nothing.
-- ============================================================================
alter table public.projects            enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_templates      enable row level security;
alter table public.project_assets      enable row level security;
alter table public.team_members        enable row level security;
alter table public.task_dependencies   enable row level security;
alter table public.production_expenses enable row level security;
alter table public.royalty_splits      enable row level security;

create policy authed_all_projects          on public.projects            for all to authenticated using (true) with check (true);
create policy authed_all_tasks             on public.tasks               for all to authenticated using (true) with check (true);
create policy authed_all_task_templates    on public.task_templates      for all to authenticated using (true) with check (true);
create policy authed_all_project_assets    on public.project_assets      for all to authenticated using (true) with check (true);
create policy authed_all_team_members      on public.team_members        for all to authenticated using (true) with check (true);
create policy authed_all_task_dependencies on public.task_dependencies   for all to authenticated using (true) with check (true);
create policy authed_all_expenses          on public.production_expenses for all to authenticated using (true) with check (true);
create policy authed_all_splits            on public.royalty_splits      for all to authenticated using (true) with check (true);
