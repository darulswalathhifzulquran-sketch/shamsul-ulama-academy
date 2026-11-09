CREATE TABLE academy_usthad_access (
 user_id TEXT PRIMARY KEY,
 display_name TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)