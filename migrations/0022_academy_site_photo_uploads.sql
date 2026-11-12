-- Public website photographs selected by the Academy's authorised Usthad/Admin.
-- Files live in persistent managed object storage; database stores references only.
CREATE TABLE IF NOT EXISTS academy_site_photos (
  slot TEXT PRIMARY KEY CHECK (slot IN ('academy','school','tuition')),
  storage_key TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  original_filename TEXT NOT NULL DEFAULT '',
  file_bytes INTEGER NOT NULL CHECK (file_bytes > 0 AND file_bytes <= 16777216),
  updated_by BIGINT REFERENCES academy_accounts_v2(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);