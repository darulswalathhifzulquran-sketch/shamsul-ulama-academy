# STAGING ONLY — NOT READY FOR PUBLIC USERS

This branch is a NON-PRODUCTION working port of the complete Shamsul Ulama Islamic Academy v16 code. It preserves every original source file and image; it is NOT a proof of a working hosted backend.

- Original Hatchable live site and original release branches are untouched.
- This staging copy must never use, fetch or mutate Hatchable's production student records, passwords, sessions, or media.
- The backend gateway maps ALL 17 existing /api routes and both rendered dashboard routes.
- The Database adapter uses a NEW isolated Netlify PostgreSQL database, never the Hatchable connection.
- Gallery adapter uses a NEW dedicated Netlify Blobs store.
- Source code includes the 14 original schema migrations, which must be applied to that new DB via Netlify's migration runner.
- The original backend allows 16 MiB direct gallery uploads. The Netlify Free function request limit is ~4.5 MiB for binary. **This incompatibility is NOT FIXED**. A genuine direct-browser-to-object-storage signed upload must be designed and tested before ANY production migration.
- All core end-to-end tests (Admin, Usthad, Student, Parent, Hifz, admission, media, permissions) remain NOT TESTED on this new host.
- This staging branch must not be used for student records, live admissions, or marketing until tests pass.

Next step: provision a genuinely isolated free PostgreSQL instance (not existing projects) and run the staging migrations with ONLY generated test data, then deploy the staged code under a free host URL. Do not make any claim of 100% functionality until all critical flows are verified.


## Staging database connected (cloud schema only)
The user has connected the dedicated Neon Free project **shamsul-ulama-staging**.
- Project ID: plain-bird-06747223 (safe identifier, NOT a secret)
- Dedicated QA branch: academy-v16-qa / br-little-queen-az3xh2j8
- Postgres 18, aws-ap-southeast-1 (Singapore).
- All 14 source SQL migrations ran successfully **on the QA branch ONLY**. Cloud check: 17 tables, 2 database functions; 0 students, 0 accounts, 0 gallery items.
- The Neon parent/default branch was checked and remains empty.
- Production Hatchable was not accessed for data transfer.
- Staging server will require ACADEMY_STAGING_DATABASE_URL set in Netlify's SECRET environment variables to the Neon QA branch's pooled PostgreSQL URL. This must not be included in GitHub.
- Netlify's automatic database integration is NOT used. The runtime does NOT fall back to any other database. It rejects hosts other than Neon and localhost.
- GitHub Actions uses the localhost allowance for synthetic ephemeral tests.
- Cloud API login tests not yet run, because no Netlify deployment or secret config exists.
