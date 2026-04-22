# Download Management UI

**Location:** `app/admin/download/`

## OVERVIEW

Download proxy management UI with history viewer, filtering, and manual download form. Uses custom hooks for state
management.

## STRUCTURE

```
download/
├── page.tsx # Main download page
├── types.ts # Download interfaces
├── components/
│   ├── DownloadList.tsx # History table with filters
│   └── DownloadForm.tsx # URL input form
└── hooks/
    └── useDownloads.ts # State management + fetch logic
```

## WHERE TO LOOK

| Task                 | Location                      | Notes                         |
| -------------------- | ----------------------------- | ----------------------------- |
| Add download feature | `page.tsx`                    | Main component                |
| Modify history table | `components/DownloadList.tsx` | Pagination, filters           |
| Change download form | `components/DownloadForm.tsx` | URL input                     |
| State management     | `hooks/useDownloads.ts`       | `fetchDownloads`, `setParams` |
| Type definitions     | `types.ts`                    | `Download` interface          |

## CONVENTIONS

- **Custom hook**: `useDownloads()` returns
  `{ downloads, loading, error, page, pageSize, total, fetchDownloads, setParams }`
- **Status filter**: `success` | `failed` dropdown filter

## ANTI-PATTERNS

- **DO NOT** duplicate fetch logic — use `useDownloads` hook
- **DO NOT** bypass SSRF validation — downloads go through `/api/download`
