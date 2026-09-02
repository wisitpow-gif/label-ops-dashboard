-- ============================================================================
-- task_comments — discussion / note thread per task
-- ----------------------------------------------------------------------------
-- author_id references team_members (nullable: a comment survives if the member
-- row is removed, and users not linked to a member still get attribution via
-- the denormalized author_name, which the UI renders directly).
-- Idempotent: safe to re-run.
-- ============================================================================

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

-- Auth-scoped RLS, consistent with every other app table (migration 0006):
-- any signed-in member can read and post; anonymous gets nothing.
alter table public.task_comments enable row level security;
drop policy if exists authed_all_task_comments on public.task_comments;
create policy authed_all_task_comments on public.task_comments
  for all to authenticated using (true) with check (true);
