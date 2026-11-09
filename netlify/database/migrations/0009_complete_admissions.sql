-- Complete public admission application + teacher-only review workflow.
-- Admission applications are not student accounts and are never exposed publicly.
CREATE TABLE academy_admission_applications (
 id BIGSERIAL PRIMARY KEY,
 application_year INTEGER NOT NULL CHECK(application_year BETWEEN 2020 AND 2200),
 student_name TEXT NOT NULL CHECK(length(student_name) BETWEEN 2 AND 140),
 date_of_birth DATE,
 current_class TEXT,
 school_or_madrasa TEXT,
 prior_hifz TEXT,
 guardian_name TEXT NOT NULL CHECK(length(guardian_name) BETWEEN 2 AND 140),
 guardian_relationship TEXT NOT NULL DEFAULT 'Parent',
 guardian_phone TEXT NOT NULL,
 alternative_phone TEXT,
 email TEXT,
 address TEXT NOT NULL,
 locality TEXT,
 district TEXT,
 postal_code TEXT,
 notes TEXT,
 consent BOOLEAN NOT NULL DEFAULT FALSE,
 status TEXT NOT NULL DEFAULT 'submitted'
  CHECK(status IN('submitted','under_review','interview','approved','rejected')),
 interview_at TIMESTAMPTZ,
 decision_reason TEXT,
 staff_note TEXT,
 reviewed_by BIGINT REFERENCES academy_accounts_v2(id) ON DELETE SET NULL,
 reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(date_of_birth IS NULL OR date_of_birth BETWEEN DATE '1990-01-01' AND CURRENT_DATE),
 CHECK(length(guardian_phone) BETWEEN 9 AND 25),
 CHECK(length(address) BETWEEN 8 AND 1000)
);
CREATE INDEX idx_academy_applications_recent ON academy_admission_applications(created_at DESC);
CREATE INDEX idx_academy_applications_status ON academy_admission_applications(status,created_at DESC);
CREATE TABLE academy_application_events (
 id BIGSERIAL PRIMARY KEY,
 application_id BIGINT NOT NULL REFERENCES academy_admission_applications(id) ON DELETE CASCADE,
 from_status TEXT,
 to_status TEXT NOT NULL,
 note TEXT,
 actor_account_id BIGINT REFERENCES academy_accounts_v2(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_academy_application_events_app ON academy_application_events(application_id,created_at DESC);