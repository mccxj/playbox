# Simplify Download Feature Plan

## Overview
Simplify `/admin/download` to a pure HTTP proxy with simple logging.

## TODOs

### Phase 1: Core Logic - Add logging to download proxy
- [x] Modify `app/api/download/route.ts` to log downloads to D1 after completion

### Phase 2: Clean up unnecessary API routes
- [x] Delete `app/api/admin/download/route.ts` (create download record endpoint)
- [x] Delete `app/api/admin/download/stats/route.ts` (stats endpoint)
- [x] Delete `app/api/admin/download/batch/route.ts` (batch delete endpoint)
- [x] Delete `app/api/admin/download/[id]/route.ts` (single delete endpoint)

### Phase 3: Simplify admin page to history viewer
- [x] Modify `app/admin/download/page.tsx` - remove stats, create button, batch delete
- [x] Modify `app/admin/download/hooks/useDownloads.ts` - remove unused methods
- [x] Modify `app/admin/download/components/DownloadList.tsx` - remove action column and selection
- [x] Delete `app/admin/download/components/DownloadStats.tsx`
- [x] Delete `app/admin/download/components/DownloadModal.tsx`
- [x] Update barrel exports in `app/admin/download/components/index.ts`

### Phase 4: Update documentation
- [x] Rewrite `app/admin/download/README.md` with simplified documentation

## Final Verification Wave
- [x] F1: Oracle - Verify architecture simplicity and correctness
- [x] F2: Manual - Run `npm run build` and `npm test` to verify no regressions
- [x] F3: Manual - Test download flow: GET /api/download?url=... works and logs
- [x] F4: Manual - Test history query: GET /api/admin/download/history returns records
