# Shamsul Ulama Islamic Academy — Full Source Backup (Live v22)

**Public website:** https://shamsul-ulama-w2kv.hatchable.site  
**Original GitHub repository:** https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy  
**Snapshot version:** v22 (12 November 2026)  
**Admin login:** https://shamsul-ulama-w2kv.hatchable.site/login  
**Admin account username:** `administration` (the password is **not** in this repository)

## Source code inventory
This repository contains all **80 stored source files** currently listed by the live Hatchable project, including its actual bundled images and SVG. The contents were copied from the live project and its five bundled images were verified byte-for-byte against the previously backed-up GitHub blobs. The source includes:

- **21 backend API handlers**: sign-in, logout, session check, password change/recovery, account/role controls, student records, admission approve/reject, gallery uploads, Academy settings and site photo upload
- **22 database migration files**: Academy schema and incremental migrations for students, accounts, admissions, Hifz records, teacher verification, gallery and website photos
- **3 private server-rendered pages**: Usthad, student/parent academy home, Hifz Journey
- **4 shared library files**: authentication, role restrictions and the private page document templates
- **28 public files**: homepage, About, Admission, Contact, Programmes front-end, staff JS/CSS, real logo/photos, typography and photo-upload controls
- **2 root files**: platform configuration and project README

The new **v22** homepage has five continually rotating typing phrases, black headline text, two simplified call-to-action buttons, prominent Academy name with authenticated-staff-managed photo space, and School Classes / Extra Tuition details at `/programmes`. The Contact information remains on the dedicated Contact page.

## Full file manifest
See `SOURCE_MANIFEST_SHA256_V22.txt` for the complete list of all **80 source paths** and each SHA-256 reported by the original project. This is a verifiable inventory, not just a ZIP of a few screenshots or HTML pages.

## Important: private production data is NOT source code
This repository must **not** contain real student/parent/staff passwords, secret authentication tokens, cookie values, live database credentials, personally identifiable student records, or private database backups. The database migrations describe schemas, not the live student's saved records. Separately uploaded images/videos stored in managed storage are not bundled source files; they must be backed up using a private, authorized procedure, not committed to a public repository.

Hatchable's generated virtual file `AGENTS.md` does not exist as a stored project source file and is excluded intentionally. All 80 real stored project files are included.

## Runtime and deployment
The source uses Hatchable's managed database/storage/route runtime and `hatchable` SDK; simply downloading the code will not automatically deploy it as an ordinary Express/React application. Running it on another host requires adapting the provider's runtime APIs and configuring a database and persistent file storage.

**Test disclosure:** Anonymous private API access denial and the public image storage endpoint were verified. No authorized end-to-end Student Password Save → Student Login test was completed. An owner-authorized Usthad media upload using a real device file was not performed, so this still needs an authenticated interactive test.
