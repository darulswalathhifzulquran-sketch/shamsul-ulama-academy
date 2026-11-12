-- Reconcile the previously existing staff-managed website photo table with the v21
-- three-photo upload implementation, without deleting or overwriting existing rows.
-- Supports both fresh installations (from migration 0022) and existing production schema.
ALTER TABLE academy_site_photos
  ADD COLUMN IF NOT EXISTS photo_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'image/jpeg',
  ADD COLUMN IF NOT EXISTS original_filename text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_bytes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_by bigint,
  ADD COLUMN IF NOT EXISTS alt_text text NOT NULL DEFAULT '';