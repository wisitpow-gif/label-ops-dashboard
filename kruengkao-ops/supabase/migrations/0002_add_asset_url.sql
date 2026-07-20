-- Asset Link feature: a delivery URL per task (Drive folder, file, etc.)
alter table public.tasks
  add column if not exists asset_url text;
