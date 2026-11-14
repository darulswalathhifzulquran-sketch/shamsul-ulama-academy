-- Optional mobile-specific homepage MP4/WebM. NULL preserves existing desktop video on mobile.
ALTER TABLE academy_public_settings ADD COLUMN IF NOT EXISTS home_mobile_video_gallery_id INTEGER;