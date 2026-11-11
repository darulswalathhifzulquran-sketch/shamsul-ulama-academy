-- Optional contact and administrative notes for Usthad and parent accounts.
-- Password hashes and salts stay in academy_accounts_v2 and are never returned to clients.
ALTER TABLE academy_accounts_v2 ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE academy_accounts_v2 ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE academy_accounts_v2 ADD COLUMN IF NOT EXISTS notes TEXT;