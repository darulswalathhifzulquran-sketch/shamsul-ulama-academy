-- STAGING ONLY — dedicated Postgres media persistence for Railway & Netlify.
-- All media is stored on the independently configured Neon QA database.
-- No production Hatchable/Netlify object store is read or altered.
CREATE TABLE academy_media_objects (
 storage_key TEXT PRIMARY KEY CHECK(storage_key LIKE 'academy/gallery/%'),
 content_type TEXT NOT NULL,
 bytes BYTEA NOT NULL CHECK(octet_length(bytes) BETWEEN 1 AND 16777216),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE academy_media_upload_sessions (
 upload_id UUID PRIMARY KEY,
 account_id BIGINT NOT NULL REFERENCES academy_accounts_v2(id) ON DELETE CASCADE,
 metadata JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_academy_media_upload_expiry ON academy_media_upload_sessions(created_at);
CREATE TABLE academy_media_upload_parts (
 upload_id UUID NOT NULL REFERENCES academy_media_upload_sessions(upload_id) ON DELETE CASCADE,
 part_index INTEGER NOT NULL CHECK(part_index BETWEEN 0 AND 7),
 bytes BYTEA NOT NULL CHECK(octet_length(bytes) BETWEEN 1 AND 2097152),
 PRIMARY KEY(upload_id,part_index)
);
