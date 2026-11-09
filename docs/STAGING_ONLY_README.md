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
