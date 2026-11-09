CREATE TABLE academy_student_access (
 id BIGSERIAL PRIMARY KEY,
 user_id TEXT NOT NULL,
 student_id BIGINT NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
 relationship TEXT NOT NULL CHECK (relationship IN ('student','parent')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(user_id,student_id,relationship)
)