-- ============================================================================
-- Assets revamp: Quick Drop ingestion + dual (cloud/local) storage tracking
-- ----------------------------------------------------------------------------
-- Replaces the rigid review flow (status/version/vault_link) with a staging
-- pipeline: a team member drops a source_link, the admin pastes the final
-- official_drive_link, and local HDD/SSD backup is tracked independently.
-- Old columns are kept (harmless) and backfilled into the new ones.
-- ============================================================================

alter table public.project_assets
  add column if not exists source_link         text,
  add column if not exists official_drive_link text,
  add column if not exists note                text,
  add column if not exists category            text not null default 'Uncategorized',
  add column if not exists is_backed_up_local  boolean not null default false;

update public.project_assets
set source_link         = coalesce(source_link, submitted_link),
    official_drive_link = coalesce(official_drive_link, vault_link),
    note                = coalesce(note, asset_name);
