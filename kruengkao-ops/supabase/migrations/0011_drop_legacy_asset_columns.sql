-- ============================================================================
-- Retire the legacy review-flow columns on project_assets.
-- ----------------------------------------------------------------------------
-- They were backfilled into the new columns by migration 0010 and are no
-- longer read/written by the app. `asset_name` was NOT NULL with no default,
-- which rejected new Quick Drop inserts — dropping it fixes that.
-- (Dropping `status` also removes its CHECK and idx_project_assets_status.)
-- ============================================================================

alter table public.project_assets
  drop column if exists provider_role,
  drop column if exists asset_name,
  drop column if exists status,
  drop column if exists submitted_link,
  drop column if exists vault_link,
  drop column if exists submitter_note,
  drop column if exists reviewer_note,
  drop column if exists version;
