# Production QA Results — Shamsul Ulama Islamic Academy
**Date:** 9 November 2026 (IST)  
**Live site:** https://shamsul-ulama-w2kv.hatchable.site  
**Production deployment:** Hatchable v15; 19 active API functions  
**Isolated QA staging:** `proj_auGapT91nSp7` (`xehb0f.hatchable.site`), fork of the exact v15 source, **without production records**.

## PASS — verified with actual HTTP responses, Chromium, or staged PostgreSQL
| Test | Environment | Observed evidence |
| --- | --- | --- |
| V15 deployment and API routing | Production | Live v15; 19 server functions active |
| Public pages | Production, Chromium | Home, About, Gallery, Admission, Contact, Login, Legacy rendered, expected headings present |
| Deep links and staff protection | Production | Public pages returned HTTP 200; anonymous /staff and /dashboard redirected to /login |
| Mobile layout | Production, Chromium at 390px | Six public pages rendered without horizontal overflow or fully broken visible images |
| Mobile navigation | Production, Chromium | Menu expanded and clicking About navigated to /about |
| Valid Admission form save | Staging | Two POST requests returned HTTP 201 with distinct application numbers |
| Invalid form and wrong-Origin validation | Staging | Invalid form returned HTTP 400, cross-origin attempt HTTP 403 |
| Reject persistence | Staging database function | Rejected status saved with event |
| Approve atomic student creation | Staging database function | Application approved, Student, Student Login, link, and first-login password-change flag present |
| Duplicate approval prevention | Staging database function | Subsequent approval returned already_approved=true, no duplicate Account |
| Public Gallery publication filter | Staging API | Published photo and video returned, Draft image excluded, storage_key not exposed |
| Media object storage basic operations | Staging | Small test file uploaded, HEAD confirmed; delete + HEAD confirmed absent |
| Non-admin access protection | Staging API | Anonymous Accounts, Students, Hifz Reports, Admission print, Gallery management and bulk deletion received HTTP 401 |
| Bulk delete mismatch safety | Staging DB | Wrong expected count rejected; records unchanged |
| Bulk delete account, Hifz and Juz cascade | Staging DB | Correct count deleted disposable Student, Login, Monthly Report, Juz Verification, Target; preserved Admission History and Admin |
| Public settings | Staging API | HTTP 200; settings object returned |
| Server logs review | Production | Most recent two days of Accounts, Applications, Gallery, Students logs: no HTTP 500 responses in inspected samples |

## FAIL / unmet requirement
- **Truly unlimited direct Photo/Video uploads:** Current Gallery handler enforces **16 MiB per direct upload**, and Hatchable retains underlying hosting/storage/runtime limits. The existing external HTTPS media link / YouTube/Vimeo flow supports larger media without routing its bytes through the form, subject to the remote host's limits. **Do not claim unlimited direct uploads work.**

## NOT VERIFIED — not safe to label PASS
- **Authenticated admin browser:** Live real-admin Login, Add Usthad UI → account saved → first-login password change. The test-login API call was blocked by an automated safety check; browser-authenticated end-to-end journey not performed.
- **Admission staff-button workflow:** Click Approve/Reject → API → database and show the one-time password using the actual Admin UI. Database function itself passed; UI not verified.
- **Parent/Student private dashboards and read-scoping:** login, published Hifz monthly/Juz data rendering, and cross-user read prohibition with real authenticated accounts.
- **Gallery staff upload:** actual multipart photo/video submission with authentication, publication, and full permanent deletion through the admin route. Storage operations and public filter were tested separately, not the entire journey.
- **Production-wide Delete All Students via browser/API:** DB function passed using disposable staging data; **never test by deleting live Academy students.**
- **Load tests, accessibility audit, real device QA, email delivery, external media provider availability, and custom-domain SSL:** no conclusive end-to-end tests performed.

## Production data — important observation
At latest read, the Live database reported: **0 Students, 1 Account, 0 Gallery items, 1 Admission Application**. This differs from earlier observations. The Production audit log shows two `student.delete` and multiple `gallery.permanent_delete` actions at approximately **16:12–16:17 IST** on 9 November 2026, **before** QA staging database test activity. No bulk-delete SQL or student deletion was executed on the production database during this QA run. If this removal was unexpected, check private production backup/restore options with the platform owner before creating replacement records. Do not infer who initiated the actions from the audit summary alone.

## Custom domain plan
- Website running on existing Hatchable URL: **done**.
- Custom `.com` domain purchase: **not verified**.
- Active site reports Hatchable tier `personal`; Builder upgrade to enable custom domains: **not verified/done**.
- Hatchable official Builder plan currently lists **USD 12/month** and 5 custom domains. Domain registration price is separate.
- Next: owner buys/confirms a domain, enables Builder, adds domain under project Settings → Domains, copies the **exact** verification TXT and A/ALIAS or CNAME values shown there, verifies HTTPS and website/login/CSRF under new host. Do not invent DNS values.
- DNS and domain SSL: **not yet configured/verified**.

Official documentation:
- https://hatchable.com/pricing
- https://hatchable.com/features/domains

## Reporting rules
**PASS** means a particular listed behavior was directly observed. **FAIL** means the stated requirement remains unmet. **NOT VERIFIED** is not equivalent to FAIL or PASS. A staging DB test does not prove a full authenticated production browser journey works.
