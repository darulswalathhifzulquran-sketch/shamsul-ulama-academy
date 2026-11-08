# Academy Sign-in and Usthad → Student → Parent data flow

Verification date: 8 November 2026.

## Important deployment boundary
- Connected source/staging project: `shamsul-ulama.hatchable.site` (`proj_nA81ZaknH1Km`).
- Intended live project: `shamsul-ulama-w2kv.hatchable.site`. **Not found in the currently connected Hatchable project list.** No changes or successful authenticated tests are claimed for this separate site.
- Do not overwrite the new project's database or use old-project accounts as production credentials.

## Read-only checks actually completed
- Connected staging database has zero accounts, students, student links, monthly reports, Juz verifications and admission applications.
- GET /api/identity/bootstrap for project owner/admin: HTTP 200, setupRequired true; anonymous: HTTP 401.
- Anonymous access to /api/academy/overview, /api/academy/monthly, /api/academy/juz and /api/academy/students: HTTP 401.
- Anonymous access to admission register: HTTP 401; public gallery: HTTP 200.
- Source code confirms that published Hifz reports and Juz progress are served from shared database tables, with account-specific student links. Admin/Usthad writes have server-side role guards and CSRF.
- Fixed the login JSON response to include must_change_password, so temporary-password logins can redirect to Change Password directly.
- Added a Refresh Progress button and an approximately 90-second visibility-aware refresh for published student/parent results.

**Not verified yet:** authenticated create/login/save/parent-view/delete flows on the new production project. Do not call this a complete end-to-end login pass.

## Initial administrator: owner-only
1. Connect ChatGPT's Hatchable plugin with the account owning `shamsul-ulama-w2kv` and confirm its project ID.
2. Back up all existing source, database and media first.
3. Sign in to that project's Hatchable owner session and open `/setup`. Username `usthad` is suggested in the form but not automatically provisioned.
4. Choose a NEW, strong private administrator password. Do not reuse one posted in chat or check secrets into GitHub.
5. After setup, use `/login`. Admin/Usthad should reach `/staff`. Student/Parent should reach `/dashboard`; temporary-password users should change passwords.

## Mandatory real-project acceptance tests
- [ ] Create a new Usthad as Admin; Usthad login works; non-admin is rejected from Add Usthad.
- [ ] Add two independent students, each with unique HIFZ admission ID and strong temporary password.
- [ ] Both student logins require password change before private dashboard access.
- [ ] Add one parent linked to student A, not student B. Parent sees A but cannot read B via a direct URL or API call.
- [ ] Usthad saves a draft monthly Hifz report for A; neither A nor parent sees draft.
- [ ] Usthad publishes the monthly report; A and parent see the same published report after Refresh Progress, visibility return, or page reload.
- [ ] Usthad verifies Juz and dua; both linked student and parent see the milestone; another family's account does not.
- [ ] Student and Parent cannot publish or modify Usthad-verified monthly reports or Juz records.
- [ ] Student can save only own Hifz target; Parent cannot change it.
- [ ] Staff resets a temporary password; old sessions are revoked; new password change required.
- [ ] Public admission submission persists and gets printable reference; Usthad can interview, approve/reject, print and enrol.
- [ ] Check logout, invalid credentials, throttling, gallery and contact, mobile layouts, keyboard navigation, SSL and deep links.
- [ ] Clean up only clearly tagged test records after verifying a backup.

## .com domain and full source
Download full source repository ZIP:
https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy/archive/refs/heads/main.zip

Source ZIP includes HTML, CSS, JS, backend API endpoints, migrations, public images and deployment guides. It is not a PostgreSQL data backup and does not include private credentials. Keeping Hatchable hosting with a custom domain avoids a costly backend migration; independent hosting requires porting the Hatchable runtime and separately migrating the database. See docs/CUSTOM_DOMAIN_AND_MIGRATION.md.
