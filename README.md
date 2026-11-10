# Shamsul Ulama Islamic Academy — Full-stack QA/Staging Source

**Important: STAGING ONLY. This is not a completed or approved production migration.**

This branch is a maintained, fully source-included port of the original Hatchable Version 16 Academy website. It preserves all original public pages, pictures, CSS, forms, role-based pages, login/authentication, 17 original HTTP API routes, the Usthad/Admin management dashboard, Hifz dashboards, and the original 14 database migrations. The QA branch adds a Node.js HTTP server for Railway, Netlify gateway compatibility, three additive migrations, admission review recovery, Neon-backed gallery storage, and an optional private Student Revision Notes feature.

**Live original (DO NOT MODIFY):** https://shamsul-ulama-w2kv.hatchable.site

## Project files

- `public/`: all frontend pages, image files and JS/CSS; no redesign.
- `api/`: all original APIs plus `api/academy/revision.js` for the optional Student daily notes.
- `pages/` and `lib/`: original HTML dashboards and secure application logic; staged hosting/runtime adapters.
- `server.mjs`: Node.js 22 native HTTP server for Railway with static frontend and backend routes using the same API handler.
- `netlify/functions/academy.js` and `netlify.toml`: Netlify Functions and existing URL rewrites.
- `migrations/0001–0014`: **unchanged original** Hatchable/PostgreSQL migrations.
- `migrations/0015–0017`: additive-only QA migrations for admission status recovery, image/video storage and Student Revision Notes.
- `netlify/database/migrations/`: same 17 SQL migration files, in order. No auto-connection to Netlify Database.
- `railway.json`: minimal Node service start command and healthcheck.
- `.github/workflows/staging-source-check.yml`: QA-only automated tests with **ephemeral local DB**, no live student data.
- `docs/STAGING_OWNER_SETUP_AND_ACCEPTANCE.md`, `docs/STAGING_RAILWAY_QA.md`: setup and acceptance requirements.

## Runtime

Two private environment settings are required on staging hosting (NEVER commit values):

- `ACADEMY_STAGING_DATABASE_URL`: **Neon `academy-v16-qa` branch** pooled PostgreSQL connection string. The hostname must be under `.neon.tech`. Never use a Hatchable production DSN. For local CI only, localhost is accepted.
- `ACADEMY_STAGING_SETUP_TOKEN`: random, owner-only, high-entropy setup key stored in the **host's environment/secret manager**, not in GitHub, the browser source, or this ZIP.

Railway deployment starts with `npm start` (Node 22), using the Railway-provided `PORT`. The web root and backend share one origin so the original SameSite/CSRF session rules continue to apply. Netlify uses `[build] publish = "public"`, functions from `netlify/functions`; see `netlify.toml` as the source of truth.

Media and chunked 16MiB uploads now store into *the isolated Neon QA PostgreSQL database* via dedicated media tables rather than using host filesystem storage. This supports Railway's stateless container but **consumes Neon database capacity and must be tested on the actual free tier**. Object storage is a future optimization, not automatically configured.

## Data protection

This is **code only**; it contains no actual Student/Parent accounts, password hashes, passwords, API keys, connection strings, sessions, privately uploaded gallery files, database backups or production information. It does not connect to Hatchable production. GitHub repository may be public. Never publish a backup there.

## Features repaired in staging

- Admission review states: Submitted → Under Review → Interview → Approved/Rejected/Cancelled.
- Previously rejected or cancelled applications may be reopened, sent to interview, or approved with the original atomic Student + Account creation; duplicate approvals do not create duplicate students.
- A previously approved Student Account cannot be cancelled by changing the admission application — preventing silent student data loss.
- Decision history and clearer error feedback on failed saves. Approval credentials are shown only once.
- PDF-ready admission print page remains private to Admin/Usthad. `Print / Save as PDF` uses the browser print dialog, not a generated downloadable PDF binary.
- Parent and Usthad accounts, secure sessions and roles, Hifz reports and Gallery remain in place.
- Student “My Daily Revision Notes” adds student-authored notes, parent read-only access, and does NOT modify teacher-verified progress.

## Validation status

Automated CI runs JavaScript parsing and source integrity checks, applies all 17 migrations to a local disposable PostgreSQL-compatible database, and exercises actual login and admission/backend APIs with **fake test accounts only**. A passing CI is **not** proof of successful production migration or hosted-browser operation. The real hosting URL, Neon QA connectivity from that host, large media uploads, custom domain and monthly free-tier limits all require verification before approval. Never claim “no errors” without all acceptance tests.

For status and one-time setup, read `docs/STAGING_OWNER_SETUP_AND_ACCEPTANCE.md` and `docs/STAGING_RAILWAY_QA.md`.

```bash
python scripts/verify_source.py
npm install
npm run test:staging:static
npm run test:staging:database
npm run test:staging:api
npm run test:staging:acceptance
```

**Do NOT execute database migrations on any production database from this ZIP.** Keep the original Hatchable website active, and await separate permission before any production data export, import or cutover.
