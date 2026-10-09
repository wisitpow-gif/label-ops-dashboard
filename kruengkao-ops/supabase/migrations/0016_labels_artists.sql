-- ============================================================================
-- labels + artists — DB source of truth for the Label → Artist roster
-- ----------------------------------------------------------------------------
-- Replaces the static LABEL_ARTISTS_DATA constant that drives the dependent
-- Label/Artist dropdowns in the project form. Each artist belongs to exactly
-- one label (FK), so the form can offer only artists signed to the chosen
-- label. The app falls back to the hardcoded constants when these tables are
-- empty, so running this migration is safe at any time.
-- ============================================================================

create table if not exists public.labels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.artists (
  id         uuid primary key default gen_random_uuid(),
  label_id   uuid not null references public.labels(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (label_id, name)
);

create index if not exists idx_artists_label on public.artists(label_id);

-- Auth-scoped RLS, consistent with every other app table (migration 0006).
alter table public.labels  enable row level security;
alter table public.artists enable row level security;

drop policy if exists authed_all_labels on public.labels;
create policy authed_all_labels on public.labels
  for all to authenticated using (true) with check (true);

drop policy if exists authed_all_artists on public.artists;
create policy authed_all_artists on public.artists
  for all to authenticated using (true) with check (true);

-- Seed the labels (order preserved from LABEL_ARTISTS_DATA).
insert into public.labels (name) values
  ('BRIDGE'), ('MACHg'), ('9Arkkhan')
on conflict (name) do nothing;

-- Seed artists, each tied to its label by name.
insert into public.artists (label_id, name)
select l.id, a.name
from public.labels l
join (values
  ('BRIDGE', 'ADORA'),
  ('BRIDGE', 'ASIA7'),
  ('BRIDGE', 'AYEJAY'),
  ('BRIDGE', 'AYLA''s'),
  ('BRIDGE', 'dena euprasert'),
  ('BRIDGE', 'Famoso'),
  ('BRIDGE', 'fit aroon'),
  ('BRIDGE', 'FLURE'),
  ('BRIDGE', 'Hard Boy'),
  ('BRIDGE', 'INDIGO'),
  ('BRIDGE', 'Jigsaw Story'),
  ('BRIDGE', 'miller'),
  ('BRIDGE', 'NINEOKMAI'),
  ('BRIDGE', 'ossey'),
  ('BRIDGE', 'Par-T'),
  ('BRIDGE', 'QEETHA'),
  ('BRIDGE', 'The Darkest Romance'),
  ('BRIDGE', 'Three Man Down'),
  ('BRIDGE', 'Tilly Birds'),
  ('MACHg', 'ก้อง ห้วยไร่'),
  ('MACHg', 'ใหม่ พัชรี'),
  ('MACHg', 'กอกี้ กวิสรา'),
  ('MACHg', 'ปราง ปรางทิพย์'),
  ('MACHg', 'หนุ่ม ปริญวัฒน์'),
  ('MACHg', 'วิว วัลนิกา'),
  ('MACHg', 'ชาชม เสาวคนธ์'),
  ('9Arkkhan', 'TaitosmitH')
) as a(label, name) on a.label = l.name
on conflict (label_id, name) do nothing;
