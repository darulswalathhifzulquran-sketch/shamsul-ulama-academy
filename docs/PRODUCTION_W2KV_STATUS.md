# Production Connection & Verification — 2026-11-08

## Project ownership
Production (connected): `proj_28yiZzMLRLsx`, `https://shamsul-ulama-w2kv.hatchable.site`, owner account connection "Shamsul Ulama - New".
Historical source/reference: `proj_nA81ZaknH1Km`, `https://shamsul-ulama.hatchable.site`.

## What is verified
- New project appears under its own owner-linked connection.
- Production includes the Home, About, Gallery, Admission, Contact and Shamsul Ulama legacy route.
- Hero heritage feature links to the full legacy essay. The image of Shamsul Ulama on the article loads at original width 362 pixels; the homepage portrait loads at 366 pixels.
- Public site and login page rendered in a 390-pixel mobile browser without horizontal overflow.
- Academy account, students, links, monthly, Juz, applications, sessions and gallery tables are queryable.
- One existing Administrator: username `administration`, active. At time of check there were zero students, parents, Hifz monthly records, Juz verifications, and applications.
- Anonymous GET requests to Accounts, Students, Monthly, Juz, Overview, Applications, and /identity/me returned HTTP 401. Public Gallery returned HTTP 200.
- Query planning succeeded for parent/student relationship scope, published-only monthly passport, published-only Juz, and session authentication.
- Hatchable dry-run validator returned 0 errors, 0 warnings with nine migration files.

## Still requires owner-side authenticated tests
- Sign in using owner-held Administrator credentials, then rotate any password already shared in a chat. No password is stored in this repository.
- Admin creates Usthad; Usthad signs in and creates a sample Student account, then links a sample Parent.
- Confirm Student and Parent see only their own linked students.
- Verify monthly report draft stays private, published report shows in both dashboards after Refresh Progress.
- Verify Juz completion, accuracy and dua reach the linked Student and Parent only.
- Test Add Student, Add Usthad, admission application register, interview/approve/reject, A4 print, reset-password, logout, CSRF and account revocation.
- Remove only test data after reviewing the results.
- Add the .com domain in Hatchable Settings, set ownership TXT and the provider-specified DNS pointing record, verify HTTPS, login cookies and deep links. Do not invent DNS values.

## Backup and deployment
- Whole source: `https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy/archive/refs/heads/main.zip`
- GitHub pre-integration backup branch: `backup/pre-w2kv-integration-2026-11-08` (previous source tree).
- The new Hatchable project's original Version 1 is retained in deployment history; a GitHub code archive is **not** a dump of the live PostgreSQL database.
- For third-party hosting, server endpoints, authentication, storage and database require portability work; safest .com path is custom domain on the same running Hatchable project.
