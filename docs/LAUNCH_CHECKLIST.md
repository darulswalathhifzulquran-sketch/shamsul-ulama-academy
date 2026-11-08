# Academy launch checklist

## Status definitions
- **Connected source/staging** = `shamsul-ulama.hatchable.site` (old Hatchable account).
- **Production website (connected)** = `shamsul-ulama-w2kv.hatchable.site` (`proj_28yiZzMLRLsx`), with deployment history containing the original Version 1 for recovery. Confirm the latest version in Hatchable Console.

## Review before public launch
- [x] New Hatchable project appears in connected project list; owner project ID confirmed.
- [ ] Backup/export new project's existing code and database before overwriting anything.
- [x] Updated reviewed source and migrations deployed to new project. Original admin and admission enquiry data retained.
- [x] Check Home, About, Admission, Contact, Login, and biography page on desktop/mobile (390px, 1280px). Gallery API checked; authenticated gallery management remains pending.
- [ ] Verify scholar portraits are the exact supplied people and are never generatively altered. Replace if higher-resolution originals arrive.
- [ ] Check login using an owner-initialized account; rotate any credential previously shared in chat.
- [ ] Admission form write succeeded (HTTP 201) and test entry was deleted; authenticated staff review/print/approve-reject still requires real staff login.
- [ ] Verify Add Usthad, Add Student, Juz Journey, Monthly Passport save actions with authenticated accounts and browser refresh.
- [ ] Verify unauthenticated visitors and parents/students cannot view or change other students' personal data.
- [ ] Confirm all gallery, address, affiliation, contact methods and academy claims with authorised personnel.
- [ ] Add the custom domain in the correct project's Settings; test DNS, certificate, mobile, and deep links.

## Owner accounts and functional-test boundary
- Database contains one active Admin username `administration` and one Usthad username `usthad` (as observed on 8 Nov 2026). Passwords are not displayed or exported.
- An existing admission enquiry was retained; verified public test application was deleted afterward.
- Anonymous users are denied the private account, student, Juz, monthly and admission-register endpoints; full cross-role logged-in Usthad–Student–Parent tests remain pending.
- The original Version 1 deployment is preserved in Hatchable History as a recovery point. GitHub ZIP is source only, not a live database backup.

## Code backup
- All checked-in public source and assets are in this repository's main branch.
- GitHub Code → Download ZIP creates a single ZIP of the code.
- No live database, sessions, passwords or secrets are included in ZIP exports.
