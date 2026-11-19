-- Additive media controls only: preserve production students, accounts, gallery and settings.
ALTER TABLE academy_public_settings ADD COLUMN IF NOT EXISTS home_video_url TEXT NOT NULL DEFAULT '';
ALTER TABLE academy_public_settings ADD COLUMN IF NOT EXISTS home_video_gallery_id INTEGER;
CREATE TABLE IF NOT EXISTS academy_media_placements(
 slot TEXT PRIMARY KEY CHECK(slot IN (
  'home_fallback','home_section','about_quran','scholar_home','scholar_profile',
  'brand_logo','learner_illustration','feature_1','feature_2','feature_3',
  'feature_4','learning_school','learning_tuition','learning_balance','learning_habits'
 )),
 gallery_id BIGINT REFERENCES academy_gallery(id) ON DELETE SET NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);