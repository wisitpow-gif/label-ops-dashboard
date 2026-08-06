-- ============================================================================
-- Explicit start_date + end_date on tasks (timeline architecture)
-- ----------------------------------------------------------------------------
-- Moves from a single computed deadline (release_date - t_minus_days) to a
-- stored date range, enabling multi-day calendar spans and a real Gantt.
-- t_minus_days / duration_days stay as the fallback for legacy rows.
-- ============================================================================

alter table public.tasks add column if not exists start_date date;
alter table public.tasks add column if not exists end_date   date;

-- Backfill Release tasks from the workback model.
update public.tasks t
set end_date   = p.release_date - t.t_minus_days,
    start_date = p.release_date - t.t_minus_days - t.duration_days
from public.projects p
where t.project_id = p.id
  and p.release_date is not null
  and t.end_date is null;

-- Backfill Internal tasks that use an explicit due_date.
update public.tasks t
set end_date   = t.due_date,
    start_date = t.due_date - t.duration_days
where t.due_date is not null and t.end_date is null;
