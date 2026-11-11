# Shamsul Ulama Islamic Academy — Complete Hatchable Source Snapshot (v19)

**Live site:** https://shamsul-ulama-w2kv.hatchable.site  
**Admin sign-in:** https://shamsul-ulama-w2kv.hatchable.site/login  
**Admin username:** `administration` (password is intentionally NOT included)  
**Project slug:** `shamsul-ulama-w2kv`  
**Deployment:** v19, 2026-11-11 15:32:40 UTC  
**Source files:** 72 project files, including 20 API handlers, 19 SQL migrations, public assets and all project pages.

## What is included
- Full public website HTML/CSS/JS and images/logo used by the deployed code
- Sign-in, sign-out, password change, admin recovery, session and authorization handlers
- Administrator/Usthad control centre and student management
- Student and Parent private home page and Hifz Journey
- Student account creation and password update code
- Public admissions, approvals/rejections, account creation on approval
- Monthly Hifz passport, Juz verification, personal planner and revision endpoints
- Gallery and settings APIs; gallery/public CMS frontend
- All SQL migration source files, Hatchable project config, original README
- `SOURCE_MANIFEST_SHA256.txt` with every stored file and its source SHA-256
- `UPDATE_MESSAGE_MALAYALAM.md` and `DEPLOYMENT_AND_SECURITY.md`

## Important distinction: source code is not live private data
This is a **complete copy of the stored Hatchable project source**, not a production database dump. It does not include real user passwords, session cookies, owner-issued recovery tokens, database credentials, environment secrets, private student records, or separately uploaded media stored outside the project source. Those must never be put into a public GitHub source archive.

The auto-generated virtual `AGENTS.md` is platform-generated documentation rather than a stored project source file and is not included. The 72 stored source files are included.

## Verification status
- Live deployment v19: confirmed.
- Rejected admissions: shown in their own section in the Usthad UI.
- Database at audit: 2 approved applications linked to students; 2 rejected applications; 3 student accounts linked to records.
- Anonymous access to private APIs: correctly returns 401.
- **Not yet verified:** authenticated end-to-end Student password save → sign-in, all Student Home and Journey actions, and Usthad writes. Do not represent these as passing until exercised with authorized test accounts.

## Running/deploying
This code uses **Hatchable's managed runtime and SDK** (`db`, auth, file-based `api/` handlers). It is not a standalone Node.js/Express project. Deploying on another host requires porting its SDK and database integration. Keep database secrets in server-side environment variables and use the SQL migrations to initialize a separate database.

See `DEPLOYMENT_AND_SECURITY.md` for further notes.
