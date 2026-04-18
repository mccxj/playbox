CREATE TABLE IF NOT EXISTS security_keys_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('API_KEY', 'REFRESH_TOKEN', 'ACCESS_TOKEN', 'OAUTH_JSON', 'EMAIL')),
  provider TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO security_keys_new (id, type, provider, content, created_at, updated_at)
SELECT id, type, provider, content, created_at, updated_at FROM security_keys;

DROP TABLE security_keys;

ALTER TABLE security_keys_new RENAME TO security_keys;

CREATE INDEX IF NOT EXISTS idx_security_keys_type ON security_keys(type);
CREATE INDEX IF NOT EXISTS idx_security_keys_provider ON security_keys(provider);
CREATE INDEX IF NOT EXISTS idx_security_keys_type_provider ON security_keys(type, provider);
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_keys_unique ON security_keys(type, provider, content);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  recipients TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  attachments TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  message_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
