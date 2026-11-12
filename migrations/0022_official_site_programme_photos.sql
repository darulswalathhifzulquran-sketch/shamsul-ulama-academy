-- Optional public-facing images uploaded exclusively by authorized academy staff.
-- Three fixed placements prevent arbitrary user-provided asset paths or page injection.
CREATE TABLE IF NOT EXISTS academy_site_photos(
  slot text PRIMARY KEY CHECK (slot IN ('hero','school','tuition')),
  storage_key text NOT NULL,
  photo_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);