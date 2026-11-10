# STAGING SOURCE — DO NOT USE FOR REAL STUDENTS

This isolated branch contains the full original Hatchable Academy Version 16 frontend and backend, the new Railway Node server and Netlify gateway, all migrations and staging tests. **It is not a verified production system.**

- All 14 original PostgreSQL migrations remain byte-for-byte unchanged.
- Three *additive staging-only* migrations (0015–0017) add admission-cancellation recovery, private Neon-backed media storage and a Student self-study journal. Database SQL is never applied to the original Hatchable service.
- Railway uses `npm start` / `server.mjs` and requires a separate Neon Free QA database connection; Netlify uses `netlify.toml` and `netlify/functions`.
- Required sensitive environment keys: `ACADEMY_STAGING_DATABASE_URL` and `ACADEMY_STAGING_SETUP_TOKEN`. No values are included.
- The Neon project `shamsul-ulama-staging`, branch `academy-v16-qa`, was previously prepared with the **first 14** migrations; adding migrations 0015–0017 to it is a separate staging-only schema task. They have not automatically been applied to Neon by merely committing code.
- The data store for test image/video uploads is now Neon Postgres **only**. It has free quota limits, and the full 16MiB upload + video playback + data-restore tests remain required on the real host.
- Local CI exercises synthetic login, reject, review, approve, cancel, account creation, teacher PDF print, parent/student access, and media. Exact CI pass/fail must be checked after each GitHub commit.
- Original Hatchable live website and all real student data are untouched by code generation.

Read README.md, docs/STAGING_OWNER_SETUP_AND_ACCEPTANCE.md, and docs/STAGING_RAILWAY_QA.md. Never deploy on `main` or treat source-build success as approval for real student use.
