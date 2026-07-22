-- Internal/Ad-Hoc tasks use category 'General', which the original release-only
-- CHECK (Digital Distribution Pack / TEASER & MV) rejects. Drop that CHECK.
-- (category stays NOT NULL; release tasks keep their existing values.)
do $$
declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.tasks'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%category%';
  if c is not null then
    execute format('alter table public.tasks drop constraint %I', c);
  end if;
end $$;
