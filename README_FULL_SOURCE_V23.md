# Shamsul Ulama Islamic Academy — Live Source v23 (12 November 2026)

**Public website:** https://shamsul-ulama-w2kv.hatchable.site  
**Existing GitHub repository:** https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy  
**Live version:** 23.

## Complete code included
This `main` branch contains **all 81 stored Hatchable project source files**, including public pages, authentication and private role dashboards, photo upload APIs, CSS and JavaScript, SQL migrations, original logo and bundled images. The exact original source files are listed with SHA-256 hashes in `SOURCE_MANIFEST_SHA256_V23.txt`.

The earlier v22 snapshot and update notes are retained for reference. The virtual, auto-generated `AGENTS.md` is not part of the original stored source.

## v23 homepage update
- Removed the repetitive **THE ACADEMY** header, duplicate Academy name, and empty rectangular photo placeholder from the welcome section's right side.
- The first screen now centers **Welcome to** and the five automatic typing phrases when no approved hero photograph is uploaded.
- As soon as the staff-uploaded hero photograph is available and loads successfully, it appears on the right in a simple editorial crop.
- Kept the Academy's green, white and black palette, working About/Admission buttons, existing public URL, and mobile adaptations.
- Repaired awkward typing phrase grammar without changing the five-phrase infinite type/erase cycle.
- Preloaded school and tuition photos independently to avoid a saved photograph becoming stuck behind a hidden lazy-loaded image.
- Improved the staff Website Photos checkbox and consent text layout; post-save success text now checks the public photo manifest.

## Test status
Passed: source JavaScript syntax checks, homepage and programmes DOM structure checks, mock image-state checks (photo missing vs present), deploy validator (zero errors and warnings), publicly served updated assets, anonymous photo API read (200), and unauthenticated photo upload block (401). The production database currently has a school image, but no hero photograph. An actual authenticated image upload via user device and a real-browser visual regression check have not been independently completed.

## Credentials and private media
Actual account passwords, production database records, secret keys, session cookies, recovery tokens and separately uploaded private media are **not** source code and are not published in this public repository. Hatchable managed APIs and storage are required to host this source without adaptation.