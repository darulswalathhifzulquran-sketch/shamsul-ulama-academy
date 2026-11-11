# Shamsul Ulama Islamic Academy — V17 master brief
Status: DEVELOPMENT ONLY. Authoritative source branch: `development/academy-v17-premium-hifz`.
Base: `staging/academy-free-hosting-v16` at `90bf895a5ec4559fe6d3773b84aac8294574e88f`.
Never modify `main`, original Hatchable production, real student records or production DB. Never deploy to production without separate owner approval.

## Non-negotiable identity
- Canonical official logo asset: `public/assets/academy-owner-official-logo.png`; use this exact asset for Home, About, Admissions, Login, Password reset, Staff, Student, Parent, mobile and favicon. Do NOT substitute an invented/generated Islamic logo. Keep the old official artwork unmodified.
- Main public pages: Home, About the Academy, Gallery, Admission, Contact, Sign In. Real academy photo only after owner approval; show an explicit image-placeholder rather than mislabel illustrative courtyard as actual campus.
- **LATEST OWNER-APPROVED OVERRIDE (2026-11-11):** Use the exact green `#075333` sampled from the owner's solid-color reference, not previous `#00B956`. All specifically marked Admission/About/Topline backgrounds must be pure white `#FFFFFF`. Restore the entire original footer layout with background `#075333` and fully visible white text. Text remains `#183B2A`, muted `#68776F`, and subtle neutral borders `#E1EFE5`. Official logo artwork remains untouched, using the owner-supplied PNG stored in `public/assets/academy-owner-official-logo.png`. This later requirement supersedes all earlier bright-green/pale-footer instructions.
- Qur'an verse: `إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ` (Al-Hijr 15:9); text immutable and correct RTL.
- Public Home below approved photo: verse, then Explore My Hifz Journey. Unauthenticated users go to safe login `next=/journey`. Journey navigation is an actual route, never an in-page scroll.

## Role design
Two primary pages for both Students and Parents: private Home `/dashboard`, and dedicated Journey `/journey`. Keep server-enforced authorization, student↔parent linking and published-only visibility. Usthad/Admin dashboard `/staff` remains intact.
Journey section 1: *Official Usthad Journey* — verified Juz, pages, monthly reports, notes, pace, accuracy, published achievements and teacher remarks.
Journey section 2: *Custom My Plan* — independent student-owned hypothetical planning data; Parent read-only. Preserve Daily Revision Notes with Student write and Parent read access. Never write custom-estimated figures into academy_hifz_monthly or academy_juz_verifications.

## Planner contract
604-page Academy Mushaf; exact Juz page boundaries must be approved against physical Mushaf. Support 1→30 and 30→1; full or individually selected Juz; exact page counts for partially completed Juz; avoid double-counting. Duration: 12, 18, 24, 30, 36 calendar months or custom target date. Study weekdays, holidays and revision-only days. Calendar-aware date math in Asia/Kolkata; exclude study-off and revision-only dates. Whole-page monthly allocation reconciles exactly: sum(month.pages)===remainingPages. Daily pace equals remaining/actual eligible study days, not ×100. Show cumulative pages, Juz milestone estimates, feasibility warning, date and revision schedule. Persist separate private table with student writes and parent read-only scope.

## Mascot
Use the owner-supplied young cartoon student with white turban, white dress, book in BOTH hands and sandals as exact look reference. Do not replace with generic/cartoon different face. A flat PNG is not a layered animation; prepare rig/spritesheet first. Intended eye blink, smile, head/arm/book/legs and breathing with glued-in-hand book. Optimize size; honor reduced-motion.

## Content studio
Existing settings and gallery remain operational. Extend via additive schema and authenticated Admin-oriented draft/publish workflow; ensure owner review of media rights, published snapshots, publish history, section visibility, labels, hero image. No student/private data in public settings.

## Deployment and acceptance
Source changes only on V17 branch, never backport automatically to main. Use disposable local/Neon QA and fake records. Confirm desktop/tablet/mobile, accessibility, logo URL 200, Arabic exact, safe redirect, admission workflows, login roles, teacher progress integrity, parent isolation, revision notes, planner math across leap years, saved plans, owner media and mascot. Updated preview URL is a verified isolated staging deployment, never original live production URL.
