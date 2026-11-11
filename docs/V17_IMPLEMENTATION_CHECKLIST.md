# V17 Implementation / test tracking

## Code / structure
- [ ] Maintain `academy-official-logo.svg` exact original in all layout headers, sidebar, favicons and auth pages
- [ ] Brand design white/green and responsive on 375 / 768 / 1440px
- [ ] Public Home: authentic academy photo or an honest empty-state, exact Al-Hijr 15:9 and Explore Journey CTA
- [ ] Separate private Home and Journey routes with login `next` handling
- [ ] Official Usthad progress first; Custom My Plan second; Daily Revision Notes preserved
- [ ] Plan engine: verified page map, N completed Juz, selected Juz, partial exact pages, direction, calendars, 30-month roadmap
- [ ] Separate saved plan data and Parent read-only + Student write checks
- [ ] Mascot animation based on supplied character, not unrelated logo or stock mascot
- [ ] Content Studio: draft, preview, publish, history and role checks
- [ ] Additive migrations and mirror migrations; do not edit migrations 0001–0017
- [ ] All existing 21 database tables and admissions workflows retained
- [ ] No private secrets / student records committed

## Owner acceptance test cases
1. [ ] Public Home correct official logo and photograph
2. [ ] Admin Usthad Student Parent login, change password, logout
3. [ ] `/journey` direct link after Login and browser refresh
4. [ ] Parent can access only approved linked students
5. [ ] Draft official reports remain hidden from Students and Parents
6. [ ] Student custom plan cannot modify Usthad verified pages
7. [ ] 7 Juz / 30 calendar months; exact selected Juz mapping
8. [ ] Forward and reverse Juz journeys, arbitrary selections and partial pages
9. [ ] 2028 leap day and month-end target dates
10. [ ] Holidays, non-study weekdays, revision-only days
11. [ ] Monthly allocations sum exactly to remaining pages
12. [ ] Save/reload/edit plan; Student write Parent read only
13. [ ] Qur'anic Arabic glyphs exact and RTL
14. [ ] Reduced-motion and mobile mascot rendering
15. [ ] Admin-only Content Studio publish, parent/student forbidden
16. [ ] Admissions approve/reject/reopen/print
17. [ ] Daily Revision Notes write/read/parent restrictions
18. [ ] Real file uploads and gallery publication
19. [ ] QR/HTTPS/custom hostname deep-link readiness
20. [ ] Free-tier resource limits and rollback proven

## Preview status
No `V17` code should be described as functional or deployed without directly observed deploy and tests. Link latest verified **preview deployment**, not the old production site.
