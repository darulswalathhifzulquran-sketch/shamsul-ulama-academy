# Academy launch checklist

## Status definitions
- **Connected source/staging** = `shamsul-ulama.hatchable.site` (old Hatchable account).
- **Intended new website** = `shamsul-ulama-w2kv.hatchable.site`. This project is **not accessible** through the currently connected Hatchable account. No deployment/verification claims should be made for it until it is connected.

## Review before public launch
- [ ] New Hatchable project appears in connected project list; confirm owner and project ID.
- [ ] Backup/export new project's existing code and database before overwriting anything.
- [ ] Deploy current reviewed source into the new project, reconciling existing functionality and data.
- [ ] Check Home, About, Gallery, Admission, Contact, and biography link on desktop/tablet/mobile.
- [ ] Verify scholar portraits are the exact supplied people and are never generatively altered. Replace if higher-resolution originals arrive.
- [ ] Check login using an owner-initialized account; rotate any credential previously shared in chat.
- [ ] Exercise Admission Application save → persistent register → View → Print → Approve/Reject; remove test data afterward.
- [ ] Verify Add Usthad, Add Student, Juz Journey, Monthly Passport save actions with authenticated accounts and browser refresh.
- [ ] Verify unauthenticated visitors and parents/students cannot view or change other students' personal data.
- [ ] Confirm all gallery, address, affiliation, contact methods and academy claims with authorised personnel.
- [ ] Add the custom domain in the correct project's Settings; test DNS, certificate, mobile, and deep links.

## Code backup
- All checked-in public source and assets are in this repository's main branch.
- GitHub Code → Download ZIP creates a single ZIP of the code.
- No live database, sessions, passwords or secrets are included in ZIP exports.
