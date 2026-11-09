# Academy v14 — Gallery and Usthad/Admission usability fixes

Live: https://shamsul-ulama-w2kv.hatchable.site

This is a copy of the deployed project source code, not a copy of private PostgreSQL data, credentials, sessions or S3 objects.

## Updates
- Staff Gallery: `Delete Permanently` directly submits a protected permanent-delete request; no `DELETE` typing and no second prompt. Backend verifies object removal for managed storage and confirms DB row removal before returning success. External hosted media can only be removed from this site's records, not from the external host.
- Multiple photos/videos in one selection; large supported photos are compressed in-browser. No arbitrary 240-item gallery listing cap. Server direct-file uploads still have hosting constraints and a 16 MiB safety cap; files larger than that require a direct secure media URL / supported video host.
- Admission approval can use a 12+ character custom temporary password set by the administrator; otherwise server generates a readable three-word random passphrase + six digits. First login still requires password change. Approval already auto-creates student and login; removed misleading second enrollment action.
- Usthad Add automatically generates unique username if left blank and a strong readable one-time password; only Administrator may add Usthads. Passwords hashed in database, one-time credentials copied by admin. UI cache-busted to v14 for correct scripts.

## Checks
- Hatchable deploy v14: successful, preflight 0 errors/warnings.
- JS syntax checked for changed staff and API files.
- Public Gallery GET returned HTTP 200.
- Unauthenticated Gallery DELETE and Usthad creation returned HTTP 401.
- Full authenticated end-to-end create/approve/delete testing is **not yet verified** and should be completed with disposable test records using a real Admin login.

Do not publish credentials or actual student data when sharing screenshots.

The git `main` branch used by Netlify remains untouched; this is an independent release branch.
