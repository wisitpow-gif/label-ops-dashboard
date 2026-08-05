-- Add an optional email to team members (groundwork for auth-linked, per-person
-- workload views). Nullable so existing rows are untouched.
alter table public.team_members add column if not exists email text;
