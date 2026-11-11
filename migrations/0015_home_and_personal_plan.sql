-- Isolated QA: optional Usthad-managed parent/student home and student-only planning baseline.
ALTER TABLE academy_public_settings
  ADD COLUMN IF NOT EXISTS home_heading text NOT NULL DEFAULT 'A place where the Qur’an lives in every heart.',
  ADD COLUMN IF NOT EXISTS home_message text NOT NULL DEFAULT 'Every day of learning is a blessing. Together with our Usthads, we nurture knowledge, discipline and the joy of memorising the Qur’an.',
  ADD COLUMN IF NOT EXISTS home_photo_url text NOT NULL DEFAULT '';
ALTER TABLE academy_student_targets
  ADD COLUMN IF NOT EXISTS planning_completed_juz smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS planning_direction text NOT NULL DEFAULT 'ascending';