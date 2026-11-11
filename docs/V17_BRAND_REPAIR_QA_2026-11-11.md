# V17 brand repair — source audit / verification (2026-11-11)
Branch: `development/academy-v17-premium-hifz`
Status: **SOURCE EDITED; QA DRAFT SAVED; NO NEW DEPLOYMENT**.
Original Hatchable production and GitHub `main` were NOT modified.

## Scope and baseline
Compared with the earlier V17 development commit `8f868ce20edc11ad994f0dc4b3df797797947493`.
Changed only UI source, CSS, logo assets, and V17 documentation. GitHub commit comparison confirmed **no changes under `api/` or `migrations/`**. Existing login/account services, admission workflow, Hifz reports, parent permissions, and Daily Revision Notes were not edited.

## Owner's original logo — byte-for-byte provenance
User-uploaded original logo saved to `public/assets/academy-owner-original-full.png` with exact SHA256
`48bd9aaaa076a9e6caff9b2c94f88f1437105a2fb60e39da7e7568a1b0f2b370`.
Active display logo `public/assets/academy-owner-official-logo.png` is a lossless crop that removes only outer white margins; SHA256
`3771249aad124732ea3aa4974cd65973844a9b2eb373d098fc9c78a3ae8a704e`.
The original illustration, logo text, embedded Arabic, shapes and colours are unchanged; no generated or redrawn logo.
Source inspection: zero old `academy-official-logo.svg` references in 24 active HTML/CSS/JS UI files. Existing historic V16 SVG stays in the repo for backwards-compatible history only; no active page uses it.

## Requested visual changes
- Green swatch sampled from owner image `image(20261111-080150).png` = **`#075333`**. Public CMS dynamic theme overrides now use this colour, as do Staff/Student/Parent screens and buttons.
- Marked Admission and About hero/heading panels and top bar backgrounds now explicit **`#FFFFFF`** (no tint / gradient).
- Footer: removed V17 stylesheet rule that forced a pale background; restored dark `#075333` background, white links and text, logo, contact numbers, affiliation, quick links, copyright and responsive grid.
- Quran verse text preserved exactly; only display font changed to `Amiri Quran` with `Amiri` fallback. Arabic calligraphic appearance requires visual browser review.

## Verification performed
- GitHub source-level logo reference scan: **PASS**, 24 active UI sources checked, old logo reference absent.
- GitHub PNG blob SHA: **PASS**, both assets match known original/cropped files.
- Source-level brand assertions: **PASS** for exact green, white heading backgrounds, dark footer, white readable footer text, media queries, theme persistence, and favicon paths.
- Login, change-password and setup script bodies compared to earlier V17 commit: **UNCHANGED**.
- Public Home `site.js` compared after only logo reference substitution: **UNCHANGED BEHAVIOUR**.
- Hatchable isolated QA `dry_run_deploy`: **0 errors, 0 warnings**.
- GitHub commit comparison: **no `api/` or migrations changes**.

## Not yet tested
- No new deployment of this repair exists, because owner explicitly prohibited deployment without separate approval.
- Therefore **no completed real-browser desktop/mobile screenshot or interactive click test** is claimed for this new revision.
- Authenticated login, admissions, Hifz, gallery and revision end-to-end checks on this revision remain NOT TESTED (no production data/credentials used).
- Original user production credentials are not necessarily valid in separate QA. QA project is a distinct site/database. In isolated QA, a read-only role count revealed one Admin account only; no username/password was accessed. Existing login throttling was not modified.
- No paid services, domains or live databases were changed.

## Review / publication
Review the V17 GitHub branch. The separate Hatchable project `xehb0f` contains a QA **draft** of these visual changes. Only after owner authorization may a new isolated QA deployment be made. Before production publication, run all existing staging acceptance tests and authenticated browser tests with synthetic accounts.
