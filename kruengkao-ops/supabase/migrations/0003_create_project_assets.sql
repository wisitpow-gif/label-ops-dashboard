-- ============================================================================
-- DAM (Digital Asset Management): project_assets table
-- ============================================================================

-- ---- Part A: create project_assets (safe to run now) ----------------------
create table if not exists public.project_assets (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  provider_role  text not null default 'Unassigned',   -- Producer / Promoter / Graphics / …
  asset_name     text not null,                          -- MV / Master Audio Pack / Single Cover …
  status         text not null default 'Pending Review'
                   check (status in ('Pending Review', 'Revision', 'Vaulted')),
  submitted_link text,
  vault_link     text,
  submitter_note text,
  reviewer_note  text,
  version        integer not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_project_assets_project_id
  on public.project_assets(project_id);
create index if not exists idx_project_assets_status
  on public.project_assets(status);

-- updated_at trigger (set_updated_at() already exists from schema.sql)
drop trigger if exists trg_project_assets_updated_at on public.project_assets;
create trigger trg_project_assets_updated_at
  before update on public.project_assets
  for each row execute function public.set_updated_at();

-- RLS — permissive for now (tighten with auth-scoped policies before deploy)
alter table public.project_assets enable row level security;
drop policy if exists internal_all_project_assets on public.project_assets;
create policy internal_all_project_assets on public.project_assets
  for all using (true) with check (true);


-- ---- Part B: drop the deprecated per-task asset columns -------------------
-- WARNING: run this ONLY AFTER the app code stops selecting these columns
-- (getDashboardData / TASK_COLS still reference asset_url right now).
-- Running it before the code refactor will 500 the dashboard.
-- (submitted_link / vault_link never existed on tasks; guarded for safety.)
alter table public.tasks drop column if exists asset_url;
alter table public.tasks drop column if exists submitted_link;
alter table public.tasks drop column if exists vault_link;
