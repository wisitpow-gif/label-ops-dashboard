-- ============================================================================
-- PRODUCTION catch-up: migrations 0012–0015 + CBS seed, in one file.
-- ----------------------------------------------------------------------------
-- Run this ONCE in the PRODUCTION Supabase SQL editor before deploying the
-- feature/online-content-category merge.
--
-- ⚠️  This is the INCREMENTAL migration script — it only ADDS things.
--     Do NOT run supabase/staging_schema.sql on production: that file starts
--     with `drop table ...` and is only for a blank staging database.
--
-- Every statement is idempotent — safe to re-run, and safe even if some of
-- these migrations were already applied.
-- ============================================================================

-- ── 0012 — Concert project type ─────────────────────────────────────────────
alter table public.projects
  drop constraint if exists projects_project_type_check;
alter table public.projects
  add constraint projects_project_type_check
  check (project_type in ('Single', 'Album', 'Live Session', 'Concert', 'Other'));

alter table public.task_templates
  drop constraint if exists task_templates_project_type_check;
alter table public.task_templates
  add constraint task_templates_project_type_check
  check (project_type in ('Single', 'Album', 'Live Session', 'Concert', 'Other'));

-- ── 0013 — task_comments (discussion thread) ────────────────────────────────
create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid references public.team_members(id) on delete set null,
  author_name text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_task_comments_task_id
  on public.task_comments(task_id);
alter table public.task_comments enable row level security;
drop policy if exists authed_all_task_comments on public.task_comments;
create policy authed_all_task_comments on public.task_comments
  for all to authenticated using (true) with check (true);

-- ── 0014 — expense_templates + Budget/Actual columns ────────────────────────
create table if not exists public.expense_templates (
  id            uuid primary key default gen_random_uuid(),
  project_type  text not null,
  expense_group text not null,
  description   text not null,
  is_recoupable boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (project_type, expense_group, description)
);
create index if not exists idx_expense_templates_project_type
  on public.expense_templates(project_type);
alter table public.expense_templates enable row level security;
drop policy if exists authed_all_expense_templates on public.expense_templates;
create policy authed_all_expense_templates on public.expense_templates
  for all to authenticated using (true) with check (true);

alter table public.production_expenses
  add column if not exists expense_group   text,
  add column if not exists budgeted_amount numeric(12, 2) not null default 0,
  add column if not exists actual_amount   numeric(12, 2) not null default 0,
  add column if not exists payment_note    text,
  add column if not exists evidence_url    text;

-- Migrate the legacy single `amount` into budgeted_amount, then drop it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'production_expenses'
      and column_name = 'amount'
  ) then
    update public.production_expenses set budgeted_amount = coalesce(amount, 0);
    alter table public.production_expenses drop column amount;
  end if;
end $$;

-- ── 0015 — verified (Account) amount — Maker vs Checker ──────────────────────
alter table public.production_expenses
  add column if not exists verified_amount numeric(12, 2) not null default 0;

-- ── Seed: 'Single' CBS (so new Single projects auto-copy these rows) ─────────
insert into public.expense_templates
  (project_type, expense_group, description, sort_order)
values
  ('Single', 'AUDIO MASTER', 'คำร้อง & ทำนอง',        0),
  ('Single', 'AUDIO MASTER', 'Producer',               1),
  ('Single', 'AUDIO MASTER', 'Arrange',                2),
  ('Single', 'AUDIO MASTER', 'Mix & Edit Mastering',   3),
  ('Single', 'AUDIO MASTER', 'Studio',                 4),
  ('Single', 'AUDIO MASTER', 'Musician',               5),
  ('Single', 'Music Video', 'ค่าถ่ายทำ (Production) - งวด 1',           10),
  ('Single', 'Music Video', 'ค่าถ่ายทำ (Production) - งวด 2',           11),
  ('Single', 'Music Video', 'หน้าผม',                                   12),
  ('Single', 'Music Video', 'เสื้อผ้า',                                 13),
  ('Single', 'Music Video', 'TECHNICIAN',                               14),
  ('Single', 'Music Video', 'BACK UP',                                  15),
  ('Single', 'Music Video', 'BEHIND THE SCENES',                        16),
  ('Single', 'Music Video', 'รถตู้วง (ค่าคิว)',                          17),
  ('Single', 'Music Video', 'ค่าน้ำมัน ทางด่วน (รถตู้วง)',              18),
  ('Single', 'Music Video', 'รถตู้เครื่อง (ค่าคิว)',                     19),
  ('Single', 'Music Video', 'ค่าน้ำมัน ทางด่วน (รถตู้เครื่อง)',         20),
  ('Single', 'Music Video', 'รถตู้ค่าย (ค่าคิว)',                        21),
  ('Single', 'Music Video', 'ค่าน้ำมัน ทางด่วน (รถตู้ค่าย)',            22),
  ('Single', 'Key Visual', 'Art Director',   30),
  ('Single', 'Key Visual', 'Photographer',   31),
  ('Single', 'Key Visual', 'TYPO',           32),
  ('Single', 'Promo Materials', 'Internal Marcom (KOLs)',        40),
  ('Single', 'Promo Materials', 'แปล Subtitle',                  41),
  ('Single', 'Promo Materials', 'ค่าออกกอง',                     42),
  ('Single', 'Promo Materials', 'ค่าเบี้ยเลี้ยง + ค่าเดินทาง',   43),
  ('Single', 'Other', 'เบ็ดเตล็ด', 50)
on conflict (project_type, expense_group, description) do nothing;

-- ── Verify (optional) ───────────────────────────────────────────────────────
-- select to_regclass('public.task_comments')     as has_comments,
--        to_regclass('public.expense_templates') as has_expense_tpl;
-- select count(*) as single_cbs_rows from public.expense_templates
--   where project_type = 'Single';   -- expect 27
