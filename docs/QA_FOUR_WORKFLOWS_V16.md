# QA — FOUR REQUESTED WORKFLOWS (v16, 9 November 2026)

Live: https://shamsul-ulama-w2kv.hatchable.site

The user specifically requested testing of only four workflows and to clearly say NO if they cannot be confirmed. The QA staging site is a separate project without production student data.

| Workflow | Directly checked | Outcome |
| --- | --- | --- |
| Admin Login → Add Usthad | Production login endpoint has historical HTTP 200 successes; an Usthad test account was inserted/read/deleted in isolated staging; no authenticated Add Usthad BUTTON + first login run was completed | **NOT VERIFIED end-to-end — NO confirmed full pass** |
| Parent/Student Browser Login | Student-to-account links and published-only Hifz filter verified in staging; no parent/student real browser sign-in | **NOT VERIFIED — NO confirmed full pass** |
| Admission Approve/Reject Buttons | Both decision types passed staging PostgreSQL stored function tests; historical production approval API PUT HTTP 200 with audit; a UI issue was found — Approve button did not sync custom password field visibility. This was fixed and deployed as **live v16** (syntax and preflight 0 warnings). Actual authenticated button click not completed | **BACKEND PASS, UI PATCH DEPLOYED, NOT VERIFIED end-to-end** |
| Gallery Upload/Delete | Historical Live API log: POST 201, DELETE 200 and audit records for actual gallery uploads/permanent deletion. Staging verified publish vs draft API visibility and object-storage put/head/delete/head; no current automated authenticated browser multipart end-to-end run | **LIVE API PASS, browser end-to-end NOT VERIFIED** |

Additional note: Direct upload remains capped at **16 MiB per file** by current server code; large photo/video can be linked from HTTPS video/file hosting. Do not claim unlimited direct uploads.

**No production user records were created or deleted in this QA pass.** The only production change was the non-destructive UI code fix; v16 deployed with 55 source files and 19 API functions, Public Gallery GET returned 200.

Automated authenticated browser tests were blocked by tool security checks, which is **not evidence that the app's login function is broken**. A real authenticated staff/parent/student session is required to upgrade the NOT VERIFIED statuses.

This source archive is code only, not a backup of production database, private uploads, sessions or passwords.
