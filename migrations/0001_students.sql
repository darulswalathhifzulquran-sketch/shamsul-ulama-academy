CREATE TABLE academy_students (
 id BIGSERIAL PRIMARY KEY,
 admission_number TEXT NOT NULL UNIQUE,
 full_name TEXT NOT NULL,
 batch_name TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)