-- Preserve existing gallery entries as photographs; add video support.
ALTER TABLE academy_gallery ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE academy_gallery ADD CONSTRAINT academy_gallery_media_type_check CHECK (media_type IN ('image', 'video'));
CREATE INDEX IF NOT EXISTS academy_gallery_public_order_idx ON academy_gallery (display_order, id) WHERE is_published = true;