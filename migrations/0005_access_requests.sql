CREATE TABLE academy_access_requests (
 user_id TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 requested_role TEXT NOT NULL CHECK (requested_role IN ('student','parent')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)