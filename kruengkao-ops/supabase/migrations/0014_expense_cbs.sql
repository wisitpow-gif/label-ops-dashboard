-- ============================================================================
-- Cost Breakdown Structure (CBS): grouped expense templates + Budget vs Actual
-- ----------------------------------------------------------------------------
-- 1) expense_templates — per-project-type CBS rows, grouped by expense_group.
-- 2) production_expenses — add expense_group, split amount into budgeted/actual,
--    add payment_note + evidence_url.
-- 3) Seed the 'Single' CBS.
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1) expense_templates -------------------------------------------------------
create table if not exists public.expense_templates (
  id            uuid primary key default gen_random_uuid(),
  project_type  text not null,
  expense_group text not null,                 -- AUDIO MASTER / Music Video / …
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

-- 2) production_expenses: expense_group + Budget/Actual + note + evidence ------
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

-- 3) Seed the 'Single' CBS ----------------------------------------------------
insert into public.expense_templates
  (project_type, expense_group, description, sort_order)
values
  -- AUDIO MASTER
  ('Single', 'AUDIO MASTER', 'คำร้อง & ทำนอง',        0),
  ('Single', 'AUDIO MASTER', 'Producer',               1),
  ('Single', 'AUDIO MASTER', 'Arrange',                2),
  ('Single', 'AUDIO MASTER', 'Mix & Edit Mastering',   3),
  ('Single', 'AUDIO MASTER', 'Studio',                 4),
  ('Single', 'AUDIO MASTER', 'Musician',               5),
  -- Music Video
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
  -- Key Visual
  ('Single', 'Key Visual', 'Art Director',   30),
  ('Single', 'Key Visual', 'Photographer',   31),
  ('Single', 'Key Visual', 'TYPO',           32),
  -- Promo Materials
  ('Single', 'Promo Materials', 'Internal Marcom (KOLs)',        40),
  ('Single', 'Promo Materials', 'แปล Subtitle',                  41),
  ('Single', 'Promo Materials', 'ค่าออกกอง',                     42),
  ('Single', 'Promo Materials', 'ค่าเบี้ยเลี้ยง + ค่าเดินทาง',   43),
  -- Other
  ('Single', 'Other', 'เบ็ดเตล็ด', 50)
on conflict (project_type, expense_group, description) do nothing;
