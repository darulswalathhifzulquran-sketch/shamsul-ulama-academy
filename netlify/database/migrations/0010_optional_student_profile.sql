-- Add optional student profile details without changing existing student records.
ALTER TABLE academy_students
 ADD COLUMN IF NOT EXISTS contact_phone TEXT,
 ADD COLUMN IF NOT EXISTS guardian_name TEXT,
 ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
 ADD COLUMN IF NOT EXISTS date_of_birth DATE,
 ADD COLUMN IF NOT EXISTS postal_address TEXT,
 ADD COLUMN IF NOT EXISTS notes TEXT;