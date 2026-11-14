-- Public Gallery visibility must be explicitly chosen by Usthad.
-- No media is deleted and existing Home/profile/media placements remain intact.
-- Prior published uploads default to NOT displayed in the standalone Gallery.
ALTER TABLE academy_gallery
 ADD COLUMN IF NOT EXISTS show_on_public_gallery BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_academy_gallery_standalone_visible
 ON academy_gallery (display_order,id)
 WHERE is_published = true AND show_on_public_gallery = true;