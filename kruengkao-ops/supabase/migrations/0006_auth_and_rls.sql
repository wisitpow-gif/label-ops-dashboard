-- ============================================================================
-- Authentication gate + auth-scoped Row Level Security
-- ----------------------------------------------------------------------------
-- Replaces the permissive "allow anyone with the anon key" policies with
-- "must be a signed-in team member", and restricts WHO can sign in (Google)
-- to an allowed company domain OR an explicit email allowlist.
-- ============================================================================

-- 1) Who is allowed to sign in --------------------------------------------------
--    A signup is accepted if its email domain is in allowed_domains OR the
--    exact address is in allowed_emails. Manage these lists from the SQL editor
--    / Table editor (they are not exposed to the app — RLS with no policy means
--    only the service role can read/write them).

create table if not exists public.allowed_domains (
  domain text primary key
);

create table if not exists public.allowed_emails (
  email text primary key
);

-- Seed the company domain (derived from the admin's address). Add more with:
--   insert into public.allowed_domains(domain) values ('example.com');
insert into public.allowed_domains(domain) values ('kruengkao.com')
  on conflict do nothing;

alter table public.allowed_domains enable row level security;
alter table public.allowed_emails  enable row level security;
-- (no policies => no anon/authenticated access; service role bypasses RLS)

-- 2) Enforce the gate on new account creation ----------------------------------
create or replace function public.enforce_allowed_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

-- 3) Auth-scoped RLS across every app table ------------------------------------
--    Shared team workspace: any signed-in member can read/write everything.
--    Anonymous (no session) gets nothing.

-- projects
drop policy if exists "internal_all_projects" on public.projects;
drop policy if exists authed_all_projects       on public.projects;
create policy authed_all_projects on public.projects
  for all to authenticated using (true) with check (true);

-- tasks
drop policy if exists "internal_all_tasks" on public.tasks;
drop policy if exists authed_all_tasks       on public.tasks;
create policy authed_all_tasks on public.tasks
  for all to authenticated using (true) with check (true);

-- production_expenses
drop policy if exists "internal_all_expenses" on public.production_expenses;
drop policy if exists authed_all_expenses       on public.production_expenses;
create policy authed_all_expenses on public.production_expenses
  for all to authenticated using (true) with check (true);

-- royalty_splits
drop policy if exists "internal_all_splits" on public.royalty_splits;
drop policy if exists authed_all_splits       on public.royalty_splits;
create policy authed_all_splits on public.royalty_splits
  for all to authenticated using (true) with check (true);

-- task_templates
drop policy if exists internal_all_task_templates on public.task_templates;
drop policy if exists authed_all_task_templates    on public.task_templates;
create policy authed_all_task_templates on public.task_templates
  for all to authenticated using (true) with check (true);

-- project_assets
drop policy if exists internal_all_project_assets on public.project_assets;
drop policy if exists authed_all_project_assets    on public.project_assets;
create policy authed_all_project_assets on public.project_assets
  for all to authenticated using (true) with check (true);

-- task_dependencies
drop policy if exists internal_all_task_dependencies on public.task_dependencies;
drop policy if exists authed_all_task_dependencies    on public.task_dependencies;
create policy authed_all_task_dependencies on public.task_dependencies
  for all to authenticated using (true) with check (true);
