-- Homepage card editor v49: supports up to 100 manually chosen cards in each
-- section, with independent visual order. Additive, no existing media deleted.
ALTER TABLE academy_home_showcase
  DROP CONSTRAINT IF EXISTS academy_home_showcase_position_check;
ALTER TABLE academy_home_showcase
  ADD CONSTRAINT academy_home_showcase_position_check
  CHECK (position BETWEEN 1 AND 100);
ALTER TABLE academy_home_showcase
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE academy_home_showcase
 SET sort_order=position
 WHERE sort_order=0;
CREATE INDEX IF NOT EXISTS academy_home_showcase_order_idx
  ON academy_home_showcase(section,sort_order,position);