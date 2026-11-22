# Vercel Full-Platform Migration — Shamsul Ulama Islamic Academy

**Prepared:** 2026-11-22  
**Production source of truth:** `https://shamsul-ulama-w2kv.hatchable.site` / Hatchable project `proj_28yiZzMLRLsx`  
**GitHub source:** `darulswalathhifzulquran-sketch/shamsul-ulama-academy` (`main`)  
**Vercel team:** `team_ZkDS6gjAqrnFwms9qQtBLjHh`  
**Migration branch:** `migration/vercel-full-platform`

## Status and access

- GitHub repository is accessible to the connected Vercel account, and its default branch is `main`.
- Latest source includes live Hatchable v128 homepage loading-image fix, including `public/assets/academy-clean-video-loading-v128.webp`.
- Vercel project does **not** yet exist. A Git-connected project creation was attempted and Vercel returned `403 forbidden: You don't have permission to create the project`.
- An independent preview deployment attempt also returned the same `403 project create` restriction.
- Vercel returned a one-time team authorization/consent link. The grant must be accepted by the account owner; its short-lived URL must never be placed in a public repository. Do **not** claim deployment has succeeded.
- No production DNS, database records, sessions, credentials, or services have been changed.

## Why a Git import alone is insufficient

This repository has static site assets in `public/` plus real production functionality in `api/`, `pages/`, and `lib/`. The backend imports Hatchable's runtime from `hatchable`, including the `db` and `storage` APIs. There is no portable root `package.json` / Vercel-native runtime adapter yet.

`public/vercel.json` is a **transitional static frontend config**: it redirects login/dashboard/admission to Hatchable and rewrites API requests there. It is **not** a full backend migration or an independent production environment. Treat any frontend-only Vercel deployment as a preview rather than the final production cutover.

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

- [x] Verify identity of GitHub source and Vercel team, production Hatchable project, and existing runtime architecture.
- [x] Preserve a dedicated migration Git branch without changing main.
- [x] Identify the Vercel project-creation permission blocker; request the specific account grant.
- [ ] Receive account/team write authorization for the Vercel connection.
- [ ] Create the intended Vercel project and initial preview.
- [ ] Port APIs/database/storage; verify schema and transfer production data privately.
- [ ] Conduct role-based/visual acceptance tests and launch production Vercel URL.
- [ ] Move domain traffic only after explicit verification.

**Do not mark this migration complete on the strength of a Git import, preview link, or HTTP 200 from a static page.**
