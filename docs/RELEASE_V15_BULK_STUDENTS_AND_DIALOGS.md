# Shamsul Ulama Islamic Academy — Release v15

Deployed 9 November 2026 at https://shamsul-ulama-w2kv.hatchable.site

## Updates
- All browser `Type DELETE` prompts in Staff UI replaced by one professionally styled centered, accessible on-page confirmation dialog with Cancel / Delete actions.
- The deletion modal is used for deleting students, Usthad accounts, parent accounts and Gallery media. Also used for sensitive Publish/Approve/Reject/Deactivate confirmations.
- Student Admission has an ADMIN-ONLY `Delete All Students` button in a clearly separated Danger Zone.
- Confirmation shows the latest student count and explicitly describes the impact. No deletion happens until the Administrator accepts.
- Dedicated `/api/academy/students-bulk-delete` DELETE route requires authenticated main Admin + CSRF token + exact scope + explicit confirmation + expected count.
- The schema-only migration `0014_admin_bulk_student_delete.sql` installs a PostgreSQL function to atomically delete student records, Hifz monthly reports, Juz verification records, linked student-login accounts and sessions. Student/parent links are removed; parent/usthad accounts remain. Admission application history is retained.
- A count mismatch aborts the transaction; an audit entry and count checks are performed inside the transaction.
- Removed the prior 500-active-student GET listing cap. The new centered dialog styles are responsive for desktop/mobile.

## Operational safety and testing
- No real students were deleted by this release; this deploy does **not** automatically run bulk cleanup.
- Release deployed successfully with no warnings.
- Confirmed SQL function installed and anonymous calls to students / bulk-delete return HTTP 401.
- Client-side JavaScript syntax checked and generated page contains the bulk button and confirmation dialog.
- Authenticated bulk deletion has not been tested using real user data; test with an isolated disposable staging project before trusting a production-wide deletion. Export/backup student data first.
- The live database, session tokens, uploads and password hashes are not included in this source-code archive.
- This is Hatchable SDK source. Deploying it as Netlify static files alone does not provide full backend functionality.

## Hosting
The `main` branch (used by Netlify) was deliberately not modified. Production runs on Hatchable, not Netlify.
