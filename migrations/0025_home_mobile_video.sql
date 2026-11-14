-- Mobile-specific homepage video; additive migration, production settings preserved.
-- Desktop hero video remains home_video_gallery_id; mobile falls back to desktop if unset.
ALTER TABLE academy_public_settings
 ADD COLUMN IF NOT EXISTS home_mobile_video_gallery_id INTEGER;