-- Requested removal of Homepage Highlights.
-- Only removes highlight placements, NOT Academy Gallery uploaded files.
-- Gallery positions limited to exactly five curated slots.
DELETE FROM academy_home_showcase WHERE section='highlights';
ALTER TABLE academy_home_showcase DROP CONSTRAINT IF EXISTS academy_home_showcase_section_check;
ALTER TABLE academy_home_showcase ADD CONSTRAINT academy_home_showcase_section_check CHECK(section='gallery');
ALTER TABLE academy_home_showcase DROP CONSTRAINT IF EXISTS academy_home_showcase_position_check;
ALTER TABLE academy_home_showcase ADD CONSTRAINT academy_home_showcase_position_check CHECK(position BETWEEN 1 AND 5);