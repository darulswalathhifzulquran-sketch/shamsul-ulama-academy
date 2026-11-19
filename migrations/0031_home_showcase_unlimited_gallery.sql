-- Remove the old five-card maximum for the Usthad-managed Homepage Gallery.
-- Retain the positive-position check and all existing cards, order and media references.
ALTER TABLE academy_home_showcase
  DROP CONSTRAINT IF EXISTS academy_home_showcase_position_check;
ALTER TABLE academy_home_showcase
  ADD CONSTRAINT academy_home_showcase_position_check CHECK (position >= 1);