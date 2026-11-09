-- Academy-managed username/password identities; no preseeded or default passwords.
CREATE TABLE academy_accounts_v2 (
 id BIGSERIAL PRIMARY KEY,
 username TEXT NOT NULL UNIQUE CHECK (username ~ '^[a-z][a-z0-9._-]{3,31}$'),
 display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('admin','usthad','student','parent')),
 password_salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 password_iterations INTEGER NOT NULL DEFAULT 310000 CHECK (password_iterations BETWEEN 210000 AND 1000000),
 active BOOLEAN NOT NULL DEFAULT true,
 must_change_password BOOLEAN NOT NULL DEFAULT true,
 failed_attempts INTEGER NOT NULL DEFAULT 0,
 locked_until TIMESTAMPTZ,
 created_by BIGINT REFERENCES academy_accounts_v2(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- The bootstrap endpoint can only establish one initial super-administrator.
CREATE UNIQUE INDEX academy_single_superadmin_v2 ON academy_accounts_v2 ((role)) WHERE role='admin';
CREATE TABLE academy_sessions_v2 (
 id BIGSERIAL PRIMARY KEY,
 account_id BIGINT NOT NULL REFERENCES academy_accounts_v2(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX academy_sessions_account_idx ON academy_sessions_v2(account_id);
CREATE INDEX academy_sessions_expiry_idx ON academy_sessions_v2(expires_at);
CREATE TABLE academy_links_v2 (
 id BIGSERIAL PRIMARY KEY,
 account_id BIGINT NOT NULL REFERENCES academy_accounts_v2(id) ON DELETE CASCADE,
 student_id BIGINT NOT NULL REFERENCES academy_students(id) ON DELETE CASCADE,
 relationship TEXT NOT NULL CHECK (relationship IN ('student','parent')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(account_id,student_id,relationship)
);
CREATE INDEX academy_links_student_idx ON academy_links_v2(student_id);
CREATE TABLE academy_login_throttle_v2 (
 username TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL DEFAULT 0,
 first_failure_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 blocked_until TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE academy_audit_v2 (
 id BIGSERIAL PRIMARY KEY,
 actor_account_id BIGINT REFERENCES academy_accounts_v2(id) ON DELETE SET NULL,
 action TEXT NOT NULL,
 target_kind TEXT,
 target_id TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX academy_audit_order_idx ON academy_audit_v2(created_at DESC);
CREATE TABLE academy_public_settings (
 id INTEGER PRIMARY KEY DEFAULT 1 CHECK(id=1),
 academy_name TEXT NOT NULL DEFAULT 'Shamsul Ulama Islamic Academy',
 subtitle TEXT NOT NULL DEFAULT 'Centre for Hifz & Higher Islamic Studies',
 address TEXT NOT NULL DEFAULT 'Perighala, Ernakulam, Kerala, India',
 affiliation TEXT NOT NULL DEFAULT 'Jamia Jalaliyya',
 affiliation_place TEXT NOT NULL DEFAULT 'Mundakkulam, Malappuram, Kerala, India',
 affiliation_url TEXT NOT NULL DEFAULT 'https://jamiajalaliyya.com/',
 phone1 TEXT NOT NULL DEFAULT '+91 94968 45773',
 phone2 TEXT NOT NULL DEFAULT '+91 95629 62762',
 office_hours TEXT NOT NULL DEFAULT '8:30 AM – 9:00 PM',
 email TEXT,
 maps_url TEXT NOT NULL DEFAULT 'https://maps.app.goo.gl/Gj9mgHHR7gRG4MiQ6',
 about TEXT NOT NULL DEFAULT 'A centre for Quran memorisation and Islamic learning under the guidance of dedicated Usthads.',
 vision TEXT NOT NULL DEFAULT 'Knowledge, character and purposeful Qur’an learning.',
 huffaz_count INTEGER NOT NULL DEFAULT 0,
 students_count INTEGER NOT NULL DEFAULT 0,
 batches_count INTEGER NOT NULL DEFAULT 0,
 service_years INTEGER NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO academy_public_settings(id) VALUES (1);
CREATE TABLE academy_gallery (
 id BIGSERIAL PRIMARY KEY,
 image_url TEXT NOT NULL,
 caption TEXT NOT NULL DEFAULT '',
 alt_text TEXT NOT NULL DEFAULT '',
 display_order INTEGER NOT NULL DEFAULT 0,
 is_published BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE academy_admission_enquiries (
 id BIGSERIAL PRIMARY KEY,
 guardian_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 student_name TEXT,
 notes TEXT,
 consent BOOLEAN NOT NULL DEFAULT false,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN('new','contacted','closed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX academy_enquiries_order_idx ON academy_admission_enquiries(created_at DESC);
CREATE TABLE academy_student_targets (
 student_id BIGINT PRIMARY KEY REFERENCES academy_students(id) ON DELETE CASCADE,
 target_date DATE,
 study_days INTEGER[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
 updated_by BIGINT REFERENCES academy_accounts_v2(id),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (array_length(study_days,1) BETWEEN 1 AND 7)
);