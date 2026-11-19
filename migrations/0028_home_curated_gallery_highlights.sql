-- Curated Homepage Gallery and Highlights.
-- Additive: existing Gallery, videos, logins, staff, student, and dashboard records untouched.
-- A Home card does not imply showing its media on the /gallery page.
CREATE TABLE IF NOT EXISTS academy_home_showcase (
  section TEXT NOT NULL CHECK (section IN ('gallery','highlights')),
  position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 4),
  gallery_id INTEGER NOT NULL REFERENCES academy_gallery(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (section,position)
);
CREATE INDEX IF NOT EXISTS academy_home_showcase_media_idx ON academy_home_showcase(gallery_id);