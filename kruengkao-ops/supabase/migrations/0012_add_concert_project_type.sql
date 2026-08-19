-- ============================================================================
-- New project type: "Concert"
-- ----------------------------------------------------------------------------
-- projects.project_type and task_templates.project_type each carry a CHECK
-- constraint listing the allowed types. Widen both to include 'Concert'.
-- (tasks.category has no CHECK — dropped in 0005 — so the new 'Demo' category
-- needs no migration; it is free text already.)
-- Idempotent: safe to re-run.
-- ============================================================================

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
