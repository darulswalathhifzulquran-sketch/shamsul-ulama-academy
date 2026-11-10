-- Staging student account feature: personal daily revision log; never alters Usthad-verified Hifz results.
CREATE TABLE academy_student_revision_notes (
 student_id BIGINT NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
 note_date DATE NOT NULL,
 new_pages SMALLINT NOT NULL DEFAULT 0 CHECK(new_pages BETWEEN 0 AND 30),
 revision_pages SMALLINT NOT NULL DEFAULT 0 CHECK(revision_pages BETWEEN 0 AND 100),
 note TEXT NOT NULL DEFAULT '' CHECK(length(note)<=800),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(student_id,note_date)
);
