# Academy Sign-in and Usthad → Student → Parent data flow

Verification date: 8 November 2026.

## Production deployment status
- Production project: `shamsul-ulama-w2kv.hatchable.site` (`proj_28yiZzMLRLsx`). Connected and deployed as Version 2 on 8 November 2026.
- The older `shamsul-ulama.hatchable.site` project is retained only as the earlier staging/reference deployment.
- Production database migrations 0001–0009 are present; core Academy tables were directly verified after deployment.
- Production administrator record exists and is active. Credentials are intentionally not stored in GitHub.
- Public Admission was tested with a temporary application: HTTP 201, database persistence confirmed, then the test record was deleted.
- Anonymous access to Student, Monthly Passport, Juz and admission-register endpoints was verified blocked with HTTP 401. Public Gallery remains readable.
- Home, About, Admission, Contact, Legacy, Login and Setup were checked at 390px and 1280px with no horizontal overflow; official logo and both scholar portraits loaded successfully.

## Read-only checks actually completed
- Connected staging database has zero accounts, students, student links, monthly reports, Juz verifications and admission applications.
- GET /api/identity/bootstrap for project owner/admin: HTTP 200, setupRequired true; anonymous: HTTP 401.
- Anonymous access to /api/academy/overview, /api/academy/monthly, /api/academy/juz and /api/academy/students: HTTP 401.
- Anonymous access to admission register: HTTP 401; public gallery: HTTP 200.
- Source code confirms that published Hifz reports and Juz progress are served from shared database tables, with account-specific student links. Admin/Usthad writes have server-side role guards and CSRF.
- Fixed the login JSON response to include must_change_password, so temporary-password logins can redirect to Change Password directly.
- Added a Refresh Progress button and an approximately 90-second visibility-aware refresh for published student/parent results.

**Still requires a human credential pass:** a real Admin/Usthad/Student/Parent sign-in sequence using private passwords. Passwords are never stored in source or GitHub, so this must be completed through the live sign-in UI.

## Administrator account
The production database has one active administrator account. Keep its password private and out of GitHub/chat logs. If it is unknown, reset it through an owner-authorized flow before launch.

## Mandatory credential acceptance tests
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
