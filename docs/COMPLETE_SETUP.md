# COMPLETE SETUP — Shamsul Ulama Islamic Academy

This is a complete source-code and setup archive of Hatchable production version 16. It is not a database or secret backup.

## 1 — Safest and easiest: keep the existing full website

Live site: https://shamsul-ulama-w2kv.hatchable.site
Project: `shamsul-ulama-w2kv`
Public ID: `proj_28yiZzMLRLsx`

The site is already deployed. Its code is preserved here. **Do not import or overwrite the existing database** to set up this code. Keep the existing Hatchable project and attach your custom domain in the platform's settings, following the DNS/HTTPS steps in `docs/CUSTOM_DOMAIN_AND_MIGRATION.md`.

## 2 — Creating a fresh Hatchable installation (not the live existing project)

1. Use the appropriate Hatchable account; create a **separate test/staging project**. The ZIP does not provide an automatic "import ZIP" button; use the project's supported file editing/upload/integration or developer workflow to populate the same project-relative directories.
2. Copy the exact folder structure: `public/`, `api/`, `lib/`, `pages/`, `migrations/`, plus `hatchable.toml`.
3. Confirm all 14 SQL migration files are present (`0001` through `0014`). On a new empty PostgreSQL project, apply them **in numeric order**, via Hatchable's migration/deploy workflow. **On an existing production project, do not re-run old create-table migrations**.
4. Confirm the app's Hatchable SDK integrations: `db`, `storage`, public page routing and `/api/*` functions. On fresh Hatchable projects these are supplied by the platform; no external PostgreSQL URL needs to be checked into Git.
5. Deploy from the staging project and confirm `/`, `/about`, `/gallery`, `/admission`, `/login`, `/staff`, and `/dashboard` resolve correctly.
6. On a **fresh empty database only**, use the application's setup/bootstrap process to create the **first Administrator** with your own strong password. On the existing live project, **do not use bootstrap again**; its administrator already exists. Do not type passwords into source files or GitHub.
7. Make a disposable test Student and Usthad account; validate first-login password change, monthly progress and restricted Parent/Student visibility.
8. Test publication and hiding of disposable gallery media, then its deliberate deletion. Check the public gallery.
9. Test a disposable admission application: Reject persists; Approve creates one Student+Login; copy the one-time password privately. Verify its password reset workflow.
10. Check site on mobile and desktop and verify DNS/HTTPS before sharing a custom domain.

## 3 — Safe production-data migration (only if changing projects)

The repository intentionally contains **zero real production records**. To carry students, Hifz reports, accounts, and upload blobs to another project, the owner must separately export the production PostgreSQL data and managed object storage using an **approved private backup channel**. Preserve relational IDs and migration versions. Verify imported row counts and permissions before cut-over. Never paste password hashes, database exports or private files into public GitHub or ChatGPT screenshots.

The source ZIP cannot restore existing passwords, sessions, live media or student progress on its own.

## 4 — Architecture

- `public/index.html` and `public/assets/*`: static content
- `api/identity/*`: session login/logout/password change
- `api/academy/*`: authenticated and public Academy APIs
- `lib/academy-auth.js`: shared role/session/CSRF/password hashing
- `lib/academy-staff-document.js`: Staff UI document
- `pages/staff.js`, `pages/dashboard.js`: server pages
- `migrations/*.sql`: PostgreSQL tables, functions and constraints
- `hatchable.toml`: project configuration
- Hatchable runtime provides the DB/storage modules and route hosting. Copying these files into another web server **without replacing Hatchable SDK functionality will not work**.

## 5 — Security and operation

Use HTTPS for real users; use role-restricted accounts; protect student/guardian data; never distribute Administrator passwords; do not expose private database backups.
For **Delete All Students** take a restorable backup first; the control intentionally deletes linked Hifz progress and Student Logins. The production record deletion cannot be undone through the UI.
Object-storage backups, third-party-hosted videos/photos, and previously cached copies may have separate deletion/retention policies.
Hatchable direct-upload size and runtime memory constraints remain; large media can be added via externally hosted HTTPS links. Links are not the same as transferring or deleting external files.

## 6 — Netlify / Vercel warning

Netlify can host the `public/` files, but this is **not** a full working Academy without porting `api/` and DB/auth/storage layers. For a fully working Academy **without rewriting the backend**, continue Hatchable.

## 7 — Local validation and re-packaging

Windows 10/11: extract the ZIP, open PowerShell in the folder, then run:

```powershell
python scripts/verify_source.py
python scripts/make_complete_zip.py
```

Only the Python standard library is required for the scripts. The first validates required source paths and migration count; the second creates your own ZIP. It does **not** boot a local Hatchable PostgreSQL server.

## 8 — Current acceptance-test status

Verified: v16 Live deployment, protected API endpoints reject anonymous calls, bulk-deletion stored function exists, all live project source paths match this GitHub archive.
Still requires your own authenticated in-browser tests: Usthad creation, app approval/rejection end-to-end, file upload/delete, password reset, and bulk delete **on staging-only disposable data**.

This release intentionally includes source/setup, not production credentials or private database data.
