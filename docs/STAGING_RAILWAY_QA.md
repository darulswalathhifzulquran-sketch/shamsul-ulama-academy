# Railway + Neon — Staging setup, NOT production

This is an alternative hosting route for Shamsul Ulama Islamic Academy. **No deployment, paid plan, domain purchase, or production migration is authorized or implied by this document.**

## Verified source

The branch `staging/academy-free-hosting-v16` contains a Node.js 22 HTTP entry point (`server.mjs`), `npm start` command, all original public assets, all original 17 Academy/identity API handlers, the private `/staff` and `/dashboard` HTML, and 17 ordered PostgreSQL migrations (14 original + 3 additive QA).

`railway.json` selects the command `npm start`. The server reads the platform-provided `PORT` and serves the frontend and backend from the same origin. It does not run unless BOTH required private environment variables are configured. No placeholder/mock backend is offered.

## Owner-only deployment checklist

1. Check Railway current plan, credits, limits and custom-domain entitlement in your account. **If billing, payment, upgrade or subscription is required, STOP**. The user has not approved spending.
2. Create a NEW Railway **staging-only** project. Never edit or reuse the original website's project or an existing production Railway/Netlify service.
3. Connect `darulswalathhifzulquran-sketch/shamsul-ulama-academy` and select **only** branch `staging/academy-free-hosting-v16`; do NOT select `main`.
4. Install and launch Node 22 with the committed `railway.json` config and command `npm start`.
5. In Railway's **private environment-variable manager**, configure exactly these two required names, never paste values into the chat or GitHub:
   - `ACADEMY_STAGING_DATABASE_URL`: pooled connection URI of **Neon Free QA branch** `academy-v16-qa` in project `shamsul-ulama-staging`. Do not use Hatchable production or Neon's empty/default branch.
   - `ACADEMY_STAGING_SETUP_TOKEN`: strong newly-generated, staging-only private owner setup key. It must not equal a live/admin password.
6. Run only after checking all settings. Provision a new Railway-generated staging URL, not a paid custom domain; keep it out of search engines.
7. In private `/setup` use a newly generated QA-only username/password and the owner setup key. Do not copy real staff/student login details.
8. Exercise every feature with made-up test data, especially Admissions, Status History, Approve (creates Student + Account), Rejection, Cancellation, Interview, PDF print, role-specific dashboards, CRUD, Gallery 1/5/10/16MiB uploads and downloads, PDF print on mobile, CSRF checks, rate limiting, session renewal and access isolation.
9. Verify file storage persists after Railway service restarts, and database snapshots/recovery before approving the system for real children or staff.

### Critical limits

Neon Free database storage is finite: media stored as Postgres BYTEA can fill it. This is **not** a substitute for a production object-storage plan until safe capacity monitoring and real recovery tests are demonstrated. Railway Free/trial availability and custom domain support can change. The code's compatibility with a Railway plan is not a claim the hosting will be permanently free.

### Never do this in staging

- Touch or export Hatchable production Student/Parent data, credentials, or uploads.
- Apply QA migrations to the Hatchable/production database.
- Put a real `DATABASE_URL`, password hash, secret, or student media in a public repository or file ZIP.
- Deploy `main`, merge to `main`, or turn a preview into the official Academy website without explicit separate consent.

Status: **Code supplied; actual Railway hosting, browser tests and production migration NOT COMPLETE**.
