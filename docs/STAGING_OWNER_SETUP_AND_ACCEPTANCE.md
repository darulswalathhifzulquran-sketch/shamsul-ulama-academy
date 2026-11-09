# NEXT STAGING STEP — OWNER-ONLY FREE NETLIFY SETUP

STOP: Do not use the Academy's original Hatchable URL/database for Netlify testing.
Do not deploy this project's old GitHub main branch (it is an unrelated/outdated static demo).

## New isolated hosting project — owner action required
1. Log into your existing Netlify account (free plan, **do not upgrade**).
2. Choose **Add new project / Import from Git** and connect your GitHub account.
3. Select the existing repository **darulswalathhifzulquran-sketch/shamsul-ulama-academy**. The source is already public, but it contains no private student data.
4. Set **Branch to deploy: staging/academy-free-hosting-v16** (not main; not complete/... and not any release branch).
5. Publish directory: public. Build settings are supplied in netlify.toml. Functions: netlify/functions. Netlify Database: automatic via @netlify/database and all 14 SQL migrations in netlify/database/migrations.
6. Create a unique dedicated staging site on the FREE tier. Suggested free URL shape: shamsul-ulama-academy-qa.netlify.app (subject to availability). Never use this preview as the final official Academy URL.
7. In Project configuration → Environment variables, create **ACADEMY_STAGING_SETUP_TOKEN**, a random high-entropy value stored ONLY in Netlify's secret configuration. Never paste the value in chat, screenshots, GitHub or public HTML. Production Hatchable credentials must NOT be copied.
8. Once the staging deployment reports success AND Netlify Database is provisioned, open /setup on the NEW Netlify URL, use the owner key privately to create a BRAND NEW disposable QA Admin. No production usernames or existing passwords are necessary.
9. Use new fictitious QA-only Student, Parent and Usthad accounts for all tests.

This guide is a plan. A working Netlify URL, database and authentication have NOT yet been observed. Do not tell real students or parents to use the staging URL.

## Required acceptance results (every item must be observed)
- Public pages / deep links / navigation / mobile screen sizes
- New Staging admin bootstrap, login, logout, CSRF and first-login change
- Admin → Add Usthad → teacher signs in and changes password
- Student registration and login; edit/delete, admission numbering
- Parent linking, login, view-only permission and cross-student data isolation
- Admission submit → approve, reject, duplicate approval blocked, print
- Monthly Hifz draft/published filtering; Juz; targets; journey calculations
- Gallery photo / video upload tests at 1, 5, 10, 16 MiB; publish, unpublish, delete and storage confirmation
- Site settings, enquiry forms, audit logs, rate limits
- Unauthorized/missing-CSRF protections; no accidental public account access
- Independent database backup, restore into a separate temporary database, and record-count comparison
- Future custom domain readiness (configuration only; DO NOT BUY)

A FAIL or NOT TESTED on even one required feature means the migration is NOT COMPLETE.
The original Hatchable app must remain operational, without any test data being written to it.

## Known free-hosting risks
- Netlify Free is capped at 300 credits/month and may suspend service if exhausted.
- The original gallery allows 16 MiB direct uploads. The staging source includes a chunked implementation, but until 5/10/16 MiB browser tests succeed it is NOT VERIFIED.
- The GitHub repo is PUBLIC. No student data, password hashes, database dumps, API keys or private media should EVER be committed.
- No existing production data is present in this staging source. Real-data transfer requires a separate, explicit future approval and verified backups.

## Progress
Source branch: staging/academy-free-hosting-v16
Full original core files retained. All 14 migrations copied unchanged.
GitHub Actions runs automated source checks (NO database end-to-end test).
Live Netlify staging site: NOT CREATED / NOT VERIFIED from this chat.
Production migration: NOT STARTED.
