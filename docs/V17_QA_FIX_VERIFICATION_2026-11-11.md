# V17 QA fix verification — 2026-11-11
Target: separate QA preview `https://xehb0f.hatchable.site`. Latest deployed version: **v11**.
Source branch: `development/academy-v17-premium-hifz`.
GitHub `main`, old Hatchable production and real production databases remain unchanged.

## Root causes and fixes
1. Daily Revision Save button was present in HTML but lacked a click handler; its API and table were absent from QA. Restored authenticated `/api/academy/revision`, additive table, history, feedback, student-only editing, and 0.5-page notes. Invalid future dates now produce clear errors.
2. The old `Verified Pages in Juz` teacher field was being mistaken for the count of completed Juz. It is correctly limited to the individual Juz's length. Added explicit Usthad **multi-Juz completed-count** form (1–30) with 604-page Mushaf exact page sum, direction and confirmed teacher action. No existing official student records were rewritten.
3. Added **Custom My Plan** mode to choose 0–30 completed Juz, study direction, optional partial page, 1/1.5/2/2.5/3-year or custom target, day-of-week schedule, month-by-month schedule and saved preferences. The planned total is separate from Usthad official pages. Planner stores and reloads `planning_mode` and `planning_partial_pages` from dedicated target fields.
4. Fixed Usthad `Open Student Journey` navigation to `/journey?student_id=...`.
5. Wired the formerly unused private Journey Usthad `Verify & Publish Milestone` control, retaining role and CSRF checks.
6. Preserved original owner-supplied Academy logo and `#075333` green. No redesign or user-provided image generation.

## Confirmed tests
- Exact page boundaries: 19 complete Juz ascending **381** pages, descending **383** pages, all 30 = **604**.
- 30-month calendar target from 2026-11-11 = **2029-05-11**; monthly planned pages sum exactly to remaining pages.
- Day-of-week schedules and fractional 0.5 pages supported; leap-year January 31 + month → February 29.
- QA deploy v11 preflight: **0 errors, 0 warnings**; deployment LIVE on the isolated QA project.
- Browser cache-busting applied to the latest Student Journey and Usthad scripts (`private-journey.js?v=11`, `staff.js?v=11`).
- QA schema contains `academy_student_revision_notes` with numeric half-page field and the newly saved plan fields.
- Authenticated synthetic QA student: revision POST **200**, saved note GET **200** with 1.5 new pages and 94 revision pages.
- Linked synthetic QA parent: revision GET **200** read-only; POST **403**.
- Future dated revision POST: **400** with explanatory error.
- Synthetic student POST to Usthad bulk verification: **403**.
- Synthetic student plan POST **200**, subsequent overview GET **200** returned `planning_completed_juz=19`, `planning_mode=juz_count`, target date and schedule.
- Synthetic parent plan edit POST **403**, read-only overview GET **200**.
- Unlinked student ID overview GET **404**.
- Synthetic fixture cleanup confirmed: **3 test accounts and 1 test student deleted**, without editing existing records.
- Static UI control/reference audit: no missing element IDs for the current Journey and Staff scripts. Every currently visible named button has a corresponding listener or form handler; the previously hidden Usthad milestone action is now wired and available to authorized staff.

## Scope / not yet established
- Staff-positive bulk-verification was not end-to-end exercised with real data; the authorization rejection path and teacher UI code were checked.
- Comprehensive interactive desktop/mobile browser regression for every Admissions/Gallery/account-management button has not yet been completed. The earlier existing workflows were preserved, but cannot all be labeled browser-verified.
- The page map matches the Academy's existing 604-page mapping. Physical Mushaf alignment should be separately checked by the Academy before treating it as an independent source of religious text pagination.
- Academy is QA-only. Site-specific personal visibility and login restrictions still apply. No production deployment was performed.
