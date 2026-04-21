-- LLM API Keys Table
-- Stores API keys for gateway authentication with metadata

CREATE TABLE IF NOT EXISTS llm_api_keys (
    id TEXT PRIMARY KEY,
    key_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    last_used_at TEXT
);

-- Index for looking up keys by hash (authentication)
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_hash ON llm_api_keys(key_hash);

-- Index for listing active keys
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_active ON llm_api_keys(is_active);

-- Index for cleanup of expired keys
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_expires ON llm_api_keys(expires_at);
