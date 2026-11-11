-- Restore the missing QA daily revision table; keep verified Hifz records untouched.
CREATE TABLE IF NOT EXISTS academy_student_revision_notes (
 student_id BIGINT NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
 note_date DATE NOT NULL,
 new_pages NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (new_pages>=0 AND new_pages<=30),
 revision_pages SMALLINT NOT NULL DEFAULT 0 CHECK (revision_pages BETWEEN 0 AND 100),
 note TEXT NOT NULL DEFAULT '' CHECK(length(note)<=800),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(student_id,note_date)
);
-- Existing GitHub V16 installations may already have the table with SMALLINT new_pages.
ALTER TABLE academy_student_revision_notes ALTER COLUMN new_pages TYPE NUMERIC(6,2) USING new_pages::numeric(6,2);