# Shamsul Ulama Islamic Academy — v12 release (9 November 2026)

Live website: https://shamsul-ulama-w2kv.hatchable.site

## What this archive contains
Frontend `public/`, backend `api/`, auth and dashboard helpers `lib/`, server pages `pages/`, PostgreSQL schema migrations `migrations/`, and tracked images/assets. This is the source-code release; it is **not** a backup of the live private PostgreSQL data, login credentials, sessions, S3 objects, or secrets.

## Gallery
- Usthad may upload JPEG, PNG, WebP, MP4, WebM files; larger photos are optimized in the browser.
- For exceptionally large files use an HTTPS direct image/video URL or a YouTube/Vimeo link; browser and server-host limits cannot be made unlimited. Current direct-form upload security cap is 16 MiB.
- New media can be published immediately or left as Draft. Existing Draft items remain Draft until explicitly published by staff.
- Unpublish hides a file without deleting it.
- Remove Permanently requires two confirmations (including typing DELETE). The API deletes storage first (if managed here), checks that it is missing, deletes the DB row, checks the row is gone, and returns an explicit verified result. Backups governed by the storage provider may have independent retention.

## Admission workflow
- Reject & Save directly submits the status change, as does Approve & Create Account.
- A PostgreSQL function `academy_decide_admission` atomically saves approved status, a new student record, hashed student login credentials, the student-account link, and an event.
- Generated student admission number: `HIFZ-YYYY-<application-id padded to at least 3 digits>`; login username is the lowercase number.
- A strong, random temporary password is displayed to the authenticated Usthad **once** after successful creation. It is stored only as a PBKDF2 password hash; first-login password change is required.
- Existing approved application cannot silently create duplicate student accounts; conflicts produce an error.

## Deployment note
The source archive is meant for the existing Hatchable project. The `api/` code imports Hatchable SDK services; it does **not** work on static Netlify hosting without a backend rewrite and PostgreSQL migration.

## Checks
- Verified: live v12 deployment, migration routine installed, anonymous gallery GET returns 200, unauthenticated admission PUT and gallery DELETE return 401, original production application/student/gallery record counts unchanged after deployment.
- Not independently verified: full authenticated Reject/Approve against a real application; large media upload in browser; successful permanent deletion against a disposable test object. Complete these acceptance tests with approved staff credentials before assuming those journeys are fully confirmed.

## Manual acceptance test
1. Login at `/staff` as Administrator, hard-refresh (Ctrl+F5).
2. Gallery: confirm an existing Draft remains private; publish a test academy photo, inspect `/gallery`; unpublish.
3. Upload a spare test photo/video or external link, then delete the disposable item using both confirmations; ensure it disappears from Admin and Public lists.
4. With a disposable test application only, Reject & Save; refresh; verify Rejected.
5. With another disposable application, Approve & Create Account; copy one-time credentials, confirm Student Admission contains the new student; sign in and change password.
6. Do not use real student credentials or personal records in publicly shared screenshots or bug reports.

## Source safety
This release is in a separate GitHub branch. The `main` branch (used by the existing Netlify deployment) was not changed.
