CREATE TABLE academy_hifz_monthly (
 id BIGSERIAL PRIMARY KEY,
 student_id BIGINT NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
 report_month DATE NOT NULL,
 new_pages NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (new_pages >= 0 AND new_pages <= 604),
 revision_pages NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (revision_pages >= 0),
 verified_total_pages NUMERIC(6,2) CHECK (verified_total_pages >= 0 AND verified_total_pages <= 604),
 accuracy_percent NUMERIC(5,2) CHECK (accuracy_percent >= 0 AND accuracy_percent <= 100),
 target_pages NUMERIC(6,2) CHECK (target_pages >= 0 AND target_pages <= 604),
 comment TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','published')),
 recorded_by_user_id TEXT,
 verified_by_user_id TEXT,
 published_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(student_id,report_month)
)