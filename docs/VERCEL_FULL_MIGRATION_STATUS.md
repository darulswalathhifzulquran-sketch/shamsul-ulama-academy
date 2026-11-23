# Vercel Full-Platform Migration — Shamsul Ulama Islamic Academy

**Updated:** 2026-11-23  
**Production source of truth:** `https://shamsul-ulama-w2kv.hatchable.site` / Hatchable project `proj_28yiZzMLRLsx`  
**GitHub source:** `darulswalathhifzulquran-sketch/shamsul-ulama-academy` (`main`)  
**Vercel team:** `team_ZkDS6gjAqrnFwms9qQtBLjHh`  
**Migration branch:** `migration/vercel-full-platform`

## Current verified rollout (2026-11-23)

- **Vercel production static site LIVE:** https://shamsul-ulama-academy.vercel.app/ (GitHub main, latest V132 hybrid navigation safeguard).
- **Hobby 12-function limit resolved:** Root `vercel.json` builds only `public/**` using `@vercel/static`; no Hatchable API files are bundled as Vercel Functions.
- **Verified HTTP:** root HTML 200; CSS and official logo image 200; V128 WebP hero poster 200; public settings/gallery/home-showcase APIs 200 through external Hatchable proxy; anonymous /api/identity/me 401; direct /login, /dashboard, /staff, /admission paths 307 to Hatchable.
- **Video seek support verified:** published MP4 video range request via Vercel redirects to original media and returns `206 Partial Content` with `Content-Range`; this is a transport check, not full browser playback validation.
- **Git auto-deploy active:** Vercel GitHub commit check returned `success` for `4bad6798ebd0f4485b28379e81e4268a111decfc` (V132).
- **Source-of-truth backend remains Hatchable:** Database, application accounts, password hashes, CSRF-checked sessions, 22 gallery entries and uploaded object storage have NOT migrated.
- **Media inventory:** 14 published stored images, 4 published stored videos, 3 unpublished stored videos, 1 additional publicly linked video. Keep unpublished files private during any transfer.
- **Accounts:** Existing 4 accounts and 2 students remain in Hatchable. No private records or credentials have been copied or committed to public GitHub.
- **Connector limitation:** Connected Vercel management API did not discover this newly created project (404), though GitHub checks and direct HTTP responses prove its deployed existence. A standalone Neon connector request was unavailable. Existing Supabase projects belong to different apps and MUST NOT be overwritten or reused for this academy.
- **No domain/DNS cutover** and no deletions from Hatchable. The original production site remains https://shamsul-ulama-w2kv.hatchable.site/.

## Why a Git import alone is insufficient

This repository has static site assets in `public/` plus real production functionality in `api/`, `pages/`, and `lib/`. The backend imports Hatchable's runtime from `hatchable`, including the `db` and `storage` APIs. There is no portable root `package.json` / Vercel-native runtime adapter yet.

The **root-level** `vercel.json` is the active transitional production frontend configuration. It redirects login/dashboard/admission to Hatchable and rewrites public API requests to Hatchable; the `public/vercel.json` file is only a legacy reference when the project root is `./`. This is **not** a full backend migration or an independent production system. Treat Vercel as a public-site hosting phase, not an authorization or data cutover.

## Production-safe, complete migration requirements

1. **Vercel Git project**: Create or reuse `shamsul-ulama-academy` within the verified team; connect exactly the public repository `darulswalathhifzulquran-sketch/shamsul-ulama-academy`, main branch, and no unrelated private staging project. Leave the active Hatchable site running until acceptance tests pass.
2. **Node ESM API compatibility**: Port all `api/academy/*` and `api/identity/*` functions, plus private `pages/dashboard.js`, `pages/staff.js`, and `pages/journey.js`, from Hatchable routing and SDK to Vercel Functions. Replace bare `lib/*` specifiers with valid imports. Preserve request bodies, query parameters, response semantics, role-based access, CSRF, and HttpOnly Secure session cookies. Account for multipart upload and Vercel request-body limits.
3. **Postgres**: Provision a dedicated, secure Postgres project (for example Neon) for this Academy, not another institution's data; apply the SQL migrations in dependency order, including duplicate-number prefixes and schema reconciliation. Back up the source and verify row counts / constraints before privately transferring data. Preserve account IDs, password hashes/salts, roles, parent/student links, admissions, published settings, monthly reports, Juz progress and gallery metadata. Do **not** copy expired or active browser sessions; require re-login after switching domains.
4. **Media**: Move original uploaded photos and videos from Hatchable object storage to a Vercel-compatible store. Maintain old-to-new storage-key mapping and ensure selected desktop/mobile hero videos, gallery cards and official images have accessible source URLs. Confirm correct MIME types, playback, byte-range support, mobile poster, publish state and upload limits. Do not publish private or unpublished media.
5. **Environment and security**: Configure production/preview keys in Vercel's secure environment settings, not GitHub or the browser. Database credentials must never be committed; use HTTPS-only cookie and CSRF protection. Configure cross-origin protection, connection pooling, error handling and rate limits. Make backups before any migration and record rollback plan.
6. **Frontend and routing**: Serve `public/` static files at site root; route public About/Admission/Contact/Gallery/biography pages and all private dashboards correctly without redirecting visitors back to Hatchable in the final cutover. Account for search engine canonical URLs and cache-control.
7. **End-to-end acceptance tests**: Anonymous API 401, unauthenticated redirects, administrator/Usthad login, account recovery, add/manage student, parent/student visibility, Juz and monthly progress, admission form/print/approval, public gallery/media uploads, homepage selected video, logout/CSRF, mobile/tablet/Desktop responsive layout and deep links.
8. **Cutover**: Only after independent Vercel production is validated and its media/data are complete should an owned custom domain be pointed at it; keep existing Hatchable live and backups available through rollback validation.

## Operator-safe sequence

- [x] Identify the original Hobby 12-function error and Vercel frontend configuration.
- [x] Deploy static site on the Git-connected Vercel Hobby production URL without changing Hatchable.
- [x] Verify homepage, static files, public API, video byte-range, login/admission redirects and anonymous identity response.
- [x] Protect SPA admission navigation from crossing between incompatible session domains.
- [x] Preserve a migration branch and explicitly inventory original gallery and account counts.
- [ ] Obtain an **Academy-specific** database/storage target with approved cost and connection permissions; do not reuse other institutions' projects.
- [ ] Stage a tested import of schema, student/account data and media; preserve all role, published/private and audit constraints. Never commit data to public GitHub.
- [ ] Port/replace Hatchable SDK `db`, `storage`, authentication, pages and all APIs to Vercel-compatible services.
- [ ] Perform write-path, video upload, login/logout, student, parent, admissions and cross-device browser tests on an independently backed preview.
- [ ] Attach a user-owned custom domain after tests, DNS and SSL verification; then plan decommissioning Hatchable only after verified rollback and backups.

**Important:** Live Vercel public pages do not mean full independence from Hatchable. Its authenticated sessions and gallery uploads are not migrated.
