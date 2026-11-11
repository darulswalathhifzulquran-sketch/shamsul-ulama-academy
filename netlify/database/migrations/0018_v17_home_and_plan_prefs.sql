-- V17 additive, reversible Home content fields; existing academic history unaffected.
ALTER TABLE academy_public_settings
 ADD COLUMN IF NOT EXISTS home_heading TEXT NOT NULL DEFAULT 'A place where the Qur’an lives in every heart.',
 ADD COLUMN IF NOT EXISTS home_message TEXT NOT NULL DEFAULT 'Every day of learning is a blessing. Our Usthads guide your journey with care.',
 ADD COLUMN IF NOT EXISTS home_photo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE academy_student_targets
 ADD COLUMN IF NOT EXISTS planning_completed_juz SMALLINT NOT NULL DEFAULT 0 CHECK (planning_completed_juz BETWEEN 0 AND 30),
 ADD COLUMN IF NOT EXISTS planning_direction TEXT NOT NULL DEFAULT 'ascending' CHECK (planning_direction IN ('ascending','descending'));
