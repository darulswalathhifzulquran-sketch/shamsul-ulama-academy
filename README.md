# SHAMSUL ULAMA ISLAMIC ACADEMY — COMPLETE SOURCE v15

Official **complete CODE backup** for the deployed Academy website.

**Live website:** https://shamsul-ulama-w2kv.hatchable.site  
**Source revision:** Hatchable Version 15, 9 November 2026  
**Hosting target:** Hatchable (managed PostgreSQL + server APIs + storage)

## What is in this one archive?

- `public/` — full frontend, home, gallery, admission, log-in pages, CSS/JS and original public image assets
- `api/` — identity, accounts, gallery, admissions, student records, Hifz and administrative APIs
- `lib/` — shared authentication and generated dashboards
- `pages/` — protected dashboard routes
- `migrations/` — all 14 PostgreSQL migrations, in order
- `hatchable.toml` — Hatchable configuration
- `docs/` — full setup, restore, data safety, testing, and domain guides
- `scripts/` — optional local verification and ZIP build utilities
- `.github/workflows/` — source-package workflow

No source code file in the live deployed project was omitted from this release. See `COMPLETE_FILE_MANIFEST.json`.

## How to set up

**Read `docs/COMPLETE_SETUP.md` first.** The existing Hatchable live website is already deployed: do NOT delete or re-create its database merely to use this ZIP.

To download one ZIP: switch to branch `complete/shamsul-ulama-academy` and choose **Code → Download ZIP**. Or run `python scripts/make_complete_zip.py` after extracting this archive to rebuild your own source ZIP.

## IMPORTANT — Code ZIP is not the live database

No student personal records, passwords, password hashes, login sessions, privately uploaded media, production secrets, or PostgreSQL backup files are packaged. These must be handled separately, securely, and only by the data owner.

Hatchable supplies the cloud runtime, database, object storage and server-side SDK. Outside Hatchable, this code **requires backend adaptation**; it cannot be made fully functional by simply dropping the ZIP into Netlify static hosting. There is no hard-coded Administrator login.

## Current features

Username/password login with scoped role checks, Usthad and student accounts, academy public content, gallery media (managed upload or secure hosted links), applications with review and approval, private Hifz monthly/juz data, student dashboards and centered delete-confirmation controls.

Version 15 adds administrator-only **Delete All Students** with an explicit confirmation and atomic database function. This is destructive and should only be used after a privately stored, verified production backup.

## Release status

Live V15 deploy succeeded, schema and API smoke checks passed. The full **authenticated** workflows (especially mass deletion, photo/video uploads and account creation) were not destructively tested on real student data. See `docs/ACCEPTANCE_TESTS.md` for safe tests with disposable test records.
