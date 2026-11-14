-- Public website top announcement bar. Additive, no student/admission changes.
-- The former address strip is replaced with editable Academy information.
ALTER TABLE academy_public_settings
  ADD COLUMN IF NOT EXISTS topbar_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS topbar_message TEXT NOT NULL DEFAULT 'Qur’an Memorisation • Islamic & Academic Education',
  ADD COLUMN IF NOT EXISTS topbar_link_label TEXT NOT NULL DEFAULT 'Explore Programmes',
  ADD COLUMN IF NOT EXISTS topbar_link_path TEXT NOT NULL DEFAULT '/programmes';