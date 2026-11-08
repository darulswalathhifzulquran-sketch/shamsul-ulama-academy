# Netlify migration: production safety gate

Status: NOT READY FOR FULL DEPLOYMENT. This document tracks the migration without touching the live Hatchable service.

## Verified blockers (8 Nov 2026)
- `lib/academy-auth.js` imports `db` from `hatchable`. Netlify cannot provide this module or its managed database automatically.
- `api/academy/*`, `api/identity/*` and `pages/*` are Hatchable runtime handlers, not deployable Netlify Functions as-is.
- `hatchable.toml` contains Hatchable-specific database access configuration.
- The live Hatchable project has 11 migrations, up to `0011_account_optional_details.sql`, and a Version 10 deployment. Verify GitHub source matches all live file hashes before deploying.
- Production database records, sessions, credentials and secrets are NOT part of GitHub. Never copy real student data into this repository.

## Safe target architecture
1. Netlify hosts the public frontend from `public/`.
2. Netlify Functions implement the API routes under `/.netlify/functions/*`, or an independently hosted API serves `/api/*`. Implement same-origin proxy rewrites only after testing.
3. A dedicated PostgreSQL database stores private data, with encrypted transport and narrowly scoped credentials stored only in Netlify environment variables.
4. Database migrations are applied in order to a **new empty staging database** first. Validate schema and role permissions.
5. Replace `hatchable` DB imports with a server-only PostgreSQL adapter; port request/response adapters, auth, sessions, CSRF, rate limiting, PDF generation, and private dashboard page routes.
6. Test login/logout/change-password, Admin/Usthad add/edit/delete with two confirmations, Student add/edit/delete, parent/student scoping, admission and PDF, monthly Hifz update, and Private Student Journey after publishing.
7. Only after authenticated end-to-end tests pass: choose an authorized, privacy-safe transfer of real production data and cutover with backups and rollback.
8. Then purchase/connect .com domain, configure DNS, TLS, redirects, and verify.

## Netlify form (staging only)
- Branch: `main` (after the migration branch is merged)
- Base directory: empty
- Build command: empty for static site; revise if build is introduced
- Publish directory: `public`
- Functions directory: `netlify/functions` **after** functions have actually been implemented
- Environment variables: none for public-only preview; backend needs secure server-side configuration

## Do not
- Do not treat a successful static Netlify deploy as proof that dashboards or private data work.
- Do not point the .com domain to Netlify until production migration passes.
- Do not publish passwords, API keys, database URLs or personal student records to GitHub.
- Do not delete the current Hatchable project.
