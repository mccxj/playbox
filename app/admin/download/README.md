# Download Proxy Feature

## Overview

This feature provides a simple HTTP download proxy with automatic logging. Files are downloaded through the server and
logged to D1 database.

## How It Works

### Download Flow

1. User provides a URL
2. Server validates the URL (SSRF protection)
3. Server fetches the file from the remote source
4. Logs the download to `download_history` table
5. Streams the file back to the client

### Endpoints

#### GET /api/download

Download a file through the proxy.

**Query Parameters:**

- `url` (required) - The URL to download from

**Example:**

```bash
curl "https://your-domain.com/api/download?url=https://example.com/file.pdf" -o file.pdf
```

#### GET /api/admin/download/history

View download history with pagination and filtering.

**Query Parameters:**

- `page` (default: 1) - Page number
- `pageSize` (default: 10) - Items per page
- `status` (optional) - Filter by status: `success` or `failed`
- `sortBy` (default: createdAt) - Sort field
- `sortOrder` (default: desc) - Sort direction
- `search` (optional) - Search in URL or filename

## Database Schema

### download_history Table

```sql
CREATE TABLE IF NOT EXISTS download_history (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  status TEXT NOT NULL,  -- 'success' or 'failed'
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Setup

Run the migration to create the table:

```bash
# Local development
npx wrangler d1 execute playbox --local --file=prisma/migrations/download_history.sql

# Production
npx wrangler d1 execute playbox --remote --file=prisma/migrations/download_history.sql
```

## Security

### SSRF Protection

All URLs are validated before downloading:

- Only HTTP/HTTPS protocols allowed
- Private IP ranges blocked (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Link-local and multicast addresses blocked
- Blocked TLDs: .local, .internal, .localhost

## UI

### /download

Simple download page with URL input form.

### /admin/download

Download history viewer with:

- Table showing all download records
- Search by URL or filename
- Filter by status
- Pagination
- Download button for successful downloads

## API Response Examples

### Successful Download

```json
{
  "success": true,
  "records": [
    {
      "id": "abc123",
      "url": "https://example.com/file.pdf",
      "filename": "file.pdf",
      "size": 1024000,
      "status": "success",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

### Failed Download

```json
{
  "success": true,
  "records": [
    {
      "id": "def456",
      "url": "https://invalid-url.com/file.pdf",
      "filename": "file.pdf",
      "size": 0,
      "status": "failed",
      "error": "HTTP 404: Not Found",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```
