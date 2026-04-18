-- Add EMAIL type to security_keys for Gmail SMTP credentials
-- The content field will store JSON with: { user, pass, from }

-- SQLite does not support ALTER TABLE to modify CHECK constraints
-- We need to recreate the table with the new constraint

-- Step 1: Create a backup table with the new schema (IF NOT EXISTS for idempotency)
CREATE TABLE IF NOT EXISTS security_keys_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('API_KEY', 'REFRESH_TOKEN', 'ACCESS_TOKEN', 'OAUTH_JSON', 'EMAIL')),
  provider TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Copy existing data (only if backup is empty to support re-runs)
INSERT INTO security_keys_new (id, type, provider, content, created_at, updated_at)
SELECT id, type, provider, content, created_at, updated_at
FROM security_keys
WHERE NOT EXISTS (SELECT 1 FROM security_keys_new);

-- Step 3: Drop the old table (IF EXISTS for idempotency)
DROP TABLE IF EXISTS security_keys;

-- Step 4: Rename the new table
ALTER TABLE security_keys_new RENAME TO security_keys;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_security_keys_type ON security_keys(type);
CREATE INDEX IF NOT EXISTS idx_security_keys_provider ON security_keys(provider);
CREATE INDEX IF NOT EXISTS idx_security_keys_type_provider ON security_keys(type, provider);
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_keys_unique ON security_keys(type, provider, content);

-- Step 6: Create email_history table for logging sent emails
CREATE TABLE IF NOT EXISTS email_history (
  id TEXT PRIMARY KEY,
  recipients TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  html_body TEXT,
  attachments TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at);
