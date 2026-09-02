-- ============================================================================
-- Maker vs Checker for production_expenses: add the verified (Account) amount.
-- ----------------------------------------------------------------------------
-- budgeted_amount = step 1 (Budget, set at initiation)
-- actual_amount   = step 2 (ใช้จริง — Producer records after spending)
-- verified_amount = step 3 (เกิดจริง — Accounting confirms after verifying)
-- Idempotent: safe to re-run.
-- ============================================================================

alter table public.production_expenses
  add column if not exists verified_amount numeric(12, 2) not null default 0;
