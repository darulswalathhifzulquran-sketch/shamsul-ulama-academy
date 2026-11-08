# SHAMSUL ULAMA ISLAMIC ACADEMY

This branch is the independent source snapshot of **Hatchable production Version 12**, developed on November 8, 2026, for the Shamsul Ulama Islamic Academy. This is NOT the previous Lovable code and does not depend on the old main branch source.

## Project
- Website: https://shamsul-ulama.hatchable.site
- Hatchable project ID: `proj_nA81ZaknH1Km`
- Project Console: https://hatchable.com/console/projects/shamsul-ulama
- Original owner account needs access to manage project visibility.

## First-time activation (requires project owner)
1. In Hatchable Console > Settings, change visibility from **Personal** to **Public** so visitors can see public website pages.
2. Sign in using the owner Hatchable account, open `/setup`, and create the initial Academy Administrator username/password. No hardcoded/default credentials were inserted.
3. Sign in via `/login`. Administrator creates Usthad accounts; Usthad admits Students with unique admission number and assigned username/password; parents get linked, read-only accounts.
4. Fill in official academy gallery, achievements, admission records and publish verified monthly passport and Juz badges.

## Features
Public: Home/About/Contact/Admission/Gallery, verified achievements only, office hours, official location map, affiliation, enquiry form, white and Islamic green theme.
Private: Usthad Control Centre; username/password accounts; Student/Parent animated Hifz Journey; study-date calculator and daily goal; verified monthly reports, 30-Juz badges with Usthad blessing; Gallery upload, site settings and admission management.

## Backend and safety
Hatchable isolates and PostgreSQL. `api/identity/*` and `lib/academy-auth.js` implement salted PBKDF2 SHA-256 password verification, opaque hashed-session tokens and Secure HttpOnly SameSite=Strict cookies, per-request CSRF checks, login throttling and role-scoped data access.

There are no default passwords, API secrets or real students in the source. **A real credential sign-in and teacher-to-parent end-to-end acceptance test remains outstanding until a valid owner creates the first administrator account.** This code is not a completed independent penetration test or an automatic deployment pipeline.

Do not commit credentials or genuine student data. Maintain the academy's privacy and permissions in future changes.
