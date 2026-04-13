-- Security Keys Table
-- Stores API keys and tokens for different AI providers

CREATE TABLE IF NOT EXISTS security_keys (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('API_KEY', 'REFRESH_TOKEN', 'ACCESS_TOKEN', 'OAUTH_JSON')),
    provider TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for efficient querying
-- Used by: KeyManager.getRandomApiKey() in src/managers/key.ts
CREATE INDEX IF NOT EXISTS idx_security_keys_type ON security_keys(type);
CREATE INDEX IF NOT EXISTS idx_security_keys_provider ON security_keys(provider);

-- Composite index for the query pattern: WHERE type = 'API_KEY' AND provider = ?
CREATE INDEX IF NOT EXISTS idx_security_keys_type_provider ON security_keys(type, provider);

-- Unique constraint to prevent duplicate keys
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_keys_unique ON security_keys(type, provider, content);
