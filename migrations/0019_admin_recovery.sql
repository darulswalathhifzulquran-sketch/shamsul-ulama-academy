-- Isolated QA owner recovery; additive only. Never apply to production without separate authorization.
CREATE TABLE IF NOT EXISTS academy_admin_recovery_tokens(
  token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  account_id BIGINT NOT NULL REFERENCES academy_accounts_v2(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academy_admin_recovery_unexpired
  ON academy_admin_recovery_tokens(account_id,expires_at) WHERE used_at IS NULL;