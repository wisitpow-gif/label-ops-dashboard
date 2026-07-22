-- ============================================================================
-- Ad-Hoc / Internal work + enforceable task dependencies (hard gates)
-- ============================================================================

-- 1) projects: work_type discriminator + optional target_date; relax
--    release-only columns to nullable so Internal work can omit them.
alter table public.projects
  add column if not exists work_type text not null default 'Release';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_work_type_check'
  ) then
    alter table public.projects
      add constraint projects_work_type_check
      check (work_type in ('Release', 'Internal'));
  end if;
end $$;

alter table public.projects add column if not exists target_date date;

alter table public.projects alter column artist       drop not null;
alter table public.projects alter column label        drop not null;
alter table public.projects alter column release_date drop not null;

-- 2) tasks: optional per-task due date (Internal tasks schedule directly by it;
--    Release tasks keep the T-minus workback and simply leave it null).
alter table public.tasks add column if not exists due_date date;

-- 3) task_dependencies: a task is gated by N prerequisite tasks.
create table if not exists public.task_dependencies (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at         timestamptz not null default now(),
  unique (task_id, depends_on_task_id),
  -- no self-dependency (deeper cycle prevention is enforced in the app layer)
  check (task_id <> depends_on_task_id)
);

create index if not exists idx_task_deps_task
  on public.task_dependencies(task_id);
create index if not exists idx_task_deps_depends_on
  on public.task_dependencies(depends_on_task_id);

-- RLS — permissive for now (tighten with auth-scoped policies before deploy)
alter table public.task_dependencies enable row level security;
drop policy if exists internal_all_task_dependencies on public.task_dependencies;
create policy internal_all_task_dependencies on public.task_dependencies
  for all using (true) with check (true);
