# Deployment and Security — v19 Source Archive

1. **Do not commit secrets.** Keep database connection credentials, cookies, API keys, recovery tokens and user passwords outside the source repository.
2. **Admin account:** `administration` is the production admin username. No password is included. Admin recovery uses a one-time owner-issued token and must not be made publicly issuable.
3. **Password handling:** the backend stores salted password hashes, not readable passwords. Newly assigned temporary passwords may require change at first sign-in.
4. **Roles:** admin, usthad, student, parent. Private APIs and pages require authenticated sessions; CSRF protections apply to writes.
5. **Database:** `migrations/` contains SQL schema and migration logic, not the live records. Use an owner-controlled private database backup for actual student records; never publish a database dump to this public repository.
6. **Uploaded gallery files:** media uploaded through the hosted app may live in managed storage rather than source files; archive them separately if needed.
7. **Platform dependency:** source uses Hatchable SDK and managed routing, not a portable Express server. Host migration requires an adapter or rewrite of server SDK calls.
8. **Testing:** the last live code audit verified 401 responses for anonymous private endpoints. Authorized, end-to-end save/login/journey tests are still pending.
9. **Source integrity:** compare files against `SOURCE_MANIFEST_SHA256.txt`. All 72 stored files were copied from the current Hatchable project or byte-compared with the already published GitHub asset originals.
10. **Virtual file:** Hatchable generates `AGENTS.md` dynamically from platform documentation; it is not one of the stored 72 project files and is intentionally not included.
