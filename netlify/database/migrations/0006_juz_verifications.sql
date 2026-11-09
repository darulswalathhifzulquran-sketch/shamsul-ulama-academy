-- Teacher-verified Juz milestones. No public access to student achievements.
CREATE TABLE academy_juz_verifications (
 id BIGSERIAL PRIMARY KEY,
 student_id BIGINT NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
 juz_number SMALLINT NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
 memorised_pages SMALLINT NOT NULL DEFAULT 0 CHECK (memorised_pages BETWEEN 0 AND 23),
 completion_verified BOOLEAN NOT NULL DEFAULT FALSE,
 accuracy_verified BOOLEAN NOT NULL DEFAULT FALSE,
 accuracy_percent NUMERIC(5,2) CHECK (accuracy_percent BETWEEN 0 AND 100),
 dua_message TEXT,
 verified_by_user_id TEXT NOT NULL,
 verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 published_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(student_id,juz_number),
 CHECK (NOT completion_verified OR published_at IS NOT NULL),
 CHECK (NOT accuracy_verified OR accuracy_percent IS NOT NULL),
 CHECK (dua_message IS NULL OR length(dua_message) <= 1600)
);
CREATE INDEX idx_academy_juz_verifications_student_published ON academy_juz_verifications(student_id,published_at);