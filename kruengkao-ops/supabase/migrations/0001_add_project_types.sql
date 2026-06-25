-- ============================================================================
-- Phase 1 — Dynamic Project Types
-- Adds projects.project_type and a task_templates table (seeded per type).
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1) projects.project_type ---------------------------------------------------
alter table public.projects
  add column if not exists project_type text not null default 'Single';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_project_type_check'
  ) then
    alter table public.projects
      add constraint projects_project_type_check
      check (project_type in ('Single', 'Album', 'Live Session', 'Other'));
  end if;
end $$;

-- 2) task_templates ----------------------------------------------------------
create table if not exists public.task_templates (
  id            uuid primary key default gen_random_uuid(),
  project_type  text not null default 'Single'
                  check (project_type in ('Single', 'Album', 'Live Session', 'Other')),
  task_key      text not null,
  category      text not null,
  task_name     text not null,
  role          text not null default 'Unassigned',
  t_minus_days  integer not null default 0,
  duration_days integer not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- one row per (type, key) so the seed below is upsert-safe
  unique (project_type, task_key)
);

create index if not exists idx_task_templates_project_type
  on public.task_templates(project_type);

-- updated_at trigger (set_updated_at() already exists from schema.sql;
-- recreate defensively so this migration is self-contained)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_task_templates_updated_at on public.task_templates;
create trigger trg_task_templates_updated_at
  before update on public.task_templates
  for each row execute function public.set_updated_at();

-- RLS — permissive for now (tighten with auth-scoped policies before deploy)
alter table public.task_templates enable row level security;
drop policy if exists internal_all_task_templates on public.task_templates;
create policy internal_all_task_templates on public.task_templates
  for all using (true) with check (true);

-- 3) Seed --------------------------------------------------------------------
-- 3a) "Single" — the current production template (Blueprint Part 3.2)
insert into public.task_templates
  (project_type, task_key, category, task_name, role, t_minus_days, duration_days, sort_order)
values
  -- Group 1: Digital Distribution Pack
  ('Single', 'fullmix',       'Digital Distribution Pack', 'Full Mix Audio',  'Promoter',        45, 14,  0),
  ('Single', 'minusone',      'Digital Distribution Pack', 'Minus One',       'Promoter',        40,  7,  1),
  ('Single', 'backing',       'Digital Distribution Pack', 'Backing Track',   'Promoter',        40,  7,  2),
  ('Single', 'metadata',      'Digital Distribution Pack', 'Metadata',        'Promoter',        28,  5,  3),
  ('Single', 'cover',         'Digital Distribution Pack', 'Single Cover',    'Graphics',        42, 21,  4),
  ('Single', 'artistprofile', 'Digital Distribution Pack', 'Artist Profile',  'Promoter',        35,  7,  5),
  ('Single', 'songprofile',   'Digital Distribution Pack', 'Song Profile',    'Promoter',        35,  7,  6),
  ('Single', 'tiktok',        'Digital Distribution Pack', 'Tiktok',          'Creative/MarCom', 21, 10,  7),
  ('Single', 'prphoto',       'Digital Distribution Pack', 'PR Photo',        'Graphics',        50, 10,  8),
  -- Group 2: TEASER & MV
  ('Single', 'shoot',         'TEASER & MV', 'ออกกอง',                'Producer', 60,  2,  9),
  ('Single', 'shootphoto',    'TEASER & MV', 'ภาพออกกอง',             'Producer', 58,  5, 10),
  ('Single', 'teasercut',     'TEASER & MV', 'TEASER Cutting Check',  'Producer', 45,  7, 11),
  ('Single', 'teasercolor',   'TEASER & MV', 'TEASER Color Check',    'Producer', 40,  5, 12),
  ('Single', 'teaserprint',   'TEASER & MV', 'TEASER Check print',    'Producer', 35,  3, 13),
  ('Single', 'mvcut',         'TEASER & MV', 'MV Cutting Check',      'Producer', 30, 10, 14),
  ('Single', 'mvcolor',       'TEASER & MV', 'MV Color Check',        'Producer', 20,  7, 15),
  ('Single', 'mvprint',       'TEASER & MV', 'MV Check print',        'Producer', 14,  3, 16),
  ('Single', 'subtitle',      'TEASER & MV', 'Subtitle',              'Producer', 10,  3, 17)
on conflict (project_type, task_key) do nothing;

-- 3b) "Album" — placeholder starter template
insert into public.task_templates
  (project_type, task_key, category, task_name, role, t_minus_days, duration_days, sort_order)
values
  ('Album', 'album_concept',  'Digital Distribution Pack', 'Album Concept & Tracklist', 'Promoter',        90, 14, 0),
  ('Album', 'album_master',   'Digital Distribution Pack', 'Album Master Audio',        'Producer',        60, 30, 1),
  ('Album', 'album_artwork',  'Digital Distribution Pack', 'Album Artwork',             'Graphics',        50, 21, 2),
  ('Album', 'album_metadata', 'Digital Distribution Pack', 'Album Metadata',            'Promoter',        28,  7, 3),
  ('Album', 'album_mv',       'TEASER & MV',               'Lead Single MV',            'Producer',        45, 20, 4)
on conflict (project_type, task_key) do nothing;

-- 3c) "Live Session" — placeholder starter template
insert into public.task_templates
  (project_type, task_key, category, task_name, role, t_minus_days, duration_days, sort_order)
values
  ('Live Session', 'live_venue', 'TEASER & MV',               'Venue & Setup Booking', 'Producer',        45,  7, 0),
  ('Live Session', 'live_shoot', 'TEASER & MV',               'Live Recording Shoot',  'Producer',        30,  2, 1),
  ('Live Session', 'live_mix',   'Digital Distribution Pack', 'Live Mix & Master',     'Producer',        20, 10, 2),
  ('Live Session', 'live_promo', 'Digital Distribution Pack', 'Promo Clips',           'Creative/MarCom', 14,  7, 3)
on conflict (project_type, task_key) do nothing;
