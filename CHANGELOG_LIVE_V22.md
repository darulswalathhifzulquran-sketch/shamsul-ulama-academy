# Full GitHub Sync — 12 November 2026

## Source
- Existing repository and existing `main` branch updated to match the original live Hatchable source v22.
- All 80 stored project source files synced, including 5 original bundled raster images; virtual generated `AGENTS.md` excluded.
- A backup branch `backup/main-before-live-v22-sync-2026-11-12` preserves the previous `main` head.

## Public UI features currently in source
- Existing live URL, preserved: https://shamsul-ulama-w2kv.hatchable.site
- Academy logo with official name in site header, address kept in the top strip.
- Five Welcome phrases cycle automatically with typing and deletion; current typed headline uses black, not gold.
- Circular arrow decorations removed from Discover the Academy and Admission Enquiry actions.
- Academy name featured on the welcome right panel, with real staff-uploaded hero photo slot.
- School Classes and Extra Tuition cards replace the former Home contact cards, each linking to `/programmes#school` or `/programmes#tuition`.
- Public programmes detail page retains structured descriptions and upload-driven classroom photos.
- Contact information remains on `/contact`.
- Staff-only Photo Management: three slots (hero/school/tuition); phone/computer file picker, preview, save/replace/remove via managed storage and authorized backend.
- Previous administrative, admissions, Hifz, student/parent pages and APIs are preserved in source.

## Verified vs pending
**Verified:** live site v22, public photo GET endpoint 200, photo database migration corrected, anonymous POST/DELETE blocked with 401, existing public routes and code files return 200, media storage SDK put/url/head/delete smoke-tested with a temporary non-photo sample, rotating text unit-tested across all five points.

**Pending:** authorized device photo upload interaction and independent end-to-end student/admin credentials checks. Do not claim these are fully tested.

## Security
The GitHub repository is currently **public**, so readable backend and frontend source code can be copied by anyone. These source files are not secret credentials. Never add production secrets, password lists, private database rows or user-uploaded confidential media here. Consider changing repository visibility to Private through GitHub settings if public source distribution is not intended.
