-- API Test History Table
-- Stores records of API test requests and responses

CREATE TABLE IF NOT EXISTS api_test_history (
	id TEXT PRIMARY KEY,
	method TEXT NOT NULL,
	url TEXT NOT NULL,
	headers TEXT,
	body TEXT,
	body_format TEXT DEFAULT 'json',
	response_status INTEGER,
	response_headers TEXT,
	response_body TEXT,
	duration_ms INTEGER,
	error_message TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_test_created_at ON api_test_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_test_method ON api_test_history(method);
