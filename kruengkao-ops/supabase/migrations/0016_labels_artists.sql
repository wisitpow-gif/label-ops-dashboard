-- ============================================================================
-- Reference tables: labels + artists (was hardcoded in lib/constants.ts)
-- ----------------------------------------------------------------------------
-- Drives the Label / Artist dropdowns in the "Initiate New Release" modal.
-- projects.label / projects.artist stay TEXT (denormalized) — these tables are
-- the pick-lists, seeded from the former LABEL_ARTISTS_DATA constant.
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.labels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.artists (
  id         uuid primary key default gen_random_uuid(),
  label_id   uuid not null references public.labels(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (label_id, name)
);

create index if not exists idx_artists_label_id on public.artists(label_id);

-- Auth-scoped RLS, consistent with every other app table (migration 0006).
alter table public.labels  enable row level security;
alter table public.artists enable row level security;
drop policy if exists authed_all_labels  on public.labels;
drop policy if exists authed_all_artists on public.artists;
create policy authed_all_labels  on public.labels
  for all to authenticated using (true) with check (true);
create policy authed_all_artists on public.artists
  for all to authenticated using (true) with check (true);

-- ── Seed (from the former LABEL_ARTISTS_DATA constant) ──────────────────────
insert into public.labels (name, sort_order) values
  ('BRIDGE', 0),
  ('MACHg', 1),
  ('9Arkkhan', 2)
on conflict (name) do nothing;

insert into public.artists (label_id, name, sort_order)
select l.id, v.name, v.ord
from (values
  ('BRIDGE', 'ADORA', 0),
  ('BRIDGE', 'ASIA7', 1),
  ('BRIDGE', 'AYEJAY', 2),
  ('BRIDGE', 'AYLA''s', 3),
  ('BRIDGE', 'dena euprasert', 4),
  ('BRIDGE', 'Famoso', 5),
  ('BRIDGE', 'fit aroon', 6),
  ('BRIDGE', 'FLURE', 7),
  ('BRIDGE', 'Hard Boy', 8),
  ('BRIDGE', 'INDIGO', 9),
  ('BRIDGE', 'Jigsaw Story', 10),
  ('BRIDGE', 'miller', 11),
  ('BRIDGE', 'NINEOKMAI', 12),
  ('BRIDGE', 'ossey', 13),
  ('BRIDGE', 'Par-T', 14),
  ('BRIDGE', 'QEETHA', 15),
  ('BRIDGE', 'The Darkest Romance', 16),
  ('BRIDGE', 'Three Man Down', 17),
  ('BRIDGE', 'Tilly Birds', 18),
  ('MACHg', 'ก้อง ห้วยไร่', 0),
  ('MACHg', 'ใหม่ พัชรี', 1),
  ('MACHg', 'กอกี้ กวิสรา', 2),
  ('MACHg', 'ปราง ปรางทิพย์', 3),
  ('MACHg', 'หนุ่ม ปริญวัฒน์', 4),
  ('MACHg', 'วิว วัลนิกา', 5),
  ('MACHg', 'ชาชม เสาวคนธ์', 6),
  ('9Arkkhan', 'TaitosmitH', 0)
) as v(label_name, name, ord)
join public.labels l on l.name = v.label_name
on conflict (label_id, name) do nothing;
