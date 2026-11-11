-- V17: private study-plan preferences only; official Usthad records are never touched.
ALTER TABLE academy_student_targets
  ADD COLUMN IF NOT EXISTS planning_mode TEXT NOT NULL DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS planning_partial_pages NUMERIC(6,2) NOT NULL DEFAULT 0;
-- The individual Juz page maximum depends on direction and Juz number, validated by the API.
