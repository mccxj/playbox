-- Download History Table
-- Stores records of all file downloads through the proxy

CREATE TABLE IF NOT EXISTS download_history (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed')),
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_download_status ON download_history(status);
CREATE INDEX IF NOT EXISTS idx_download_created_at ON download_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_filename ON download_history(filename);
