# SHAMSUL ULAMA ISLAMIC ACADEMY

Official website source code, maintained in this repository. This is the **source for the connected Hatchable project** `shamsul-ulama` and is not automatically the code running at `shamsul-ulama-w2kv.hatchable.site` (a separately owned project that must be connected before deployment).

## Current website source
- Connected Hatchable source project: `proj_nA81ZaknH1Km`
- Connected project URL: https://shamsul-ulama.hatchable.site
- Desired separate production project (deployment pending connection): https://shamsul-ulama-w2kv.hatchable.site
- Public pages: Home, About, Gallery, Admission, Contact; biography: `/shamsul-ulama-legacy`
- Staff, student and parent dashboard, Hifz Journey, monthly growth reports, academy settings and official admissions

## Download the whole source as one ZIP
Open the green **Code** button in this GitHub repository and choose **Download ZIP**. You can also use the `main.zip` archive:
https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy/archive/refs/heads/main.zip

The ZIP includes application code, publicly committed site assets, migrations and guides. **It does not include private PostgreSQL data, personal user records, live authentication sessions, secrets, nor Hatchable's managed hosting runtime.** A ZIP is a backup/export of code, not a complete independent web server.

## Running on the custom domain
The quickest and safest option for a domain without a backend migration is to keep the app deployed on the correct Hatchable project and add a custom domain in the Hatchable project Settings. See [docs/CUSTOM_DOMAIN_AND_MIGRATION.md](docs/CUSTOM_DOMAIN_AND_MIGRATION.md) for owner-only steps, DNS requirements, and what must change if leaving Hatchable.

## Authentication
The current backend uses `api/identity/*` plus `lib/academy-auth.js` for server-side credential handling, hashed sessions, CSRF and role-scoped access. **There is no hardcoded administrator password.** The actual project owner must initialize and verify their Usthad/Administrator account in that project's own database. Each Hatchable project has its own independent database, which means credentials do not transfer just by copying the source.

## Login and synchronized Hifz dashboard checks
See [docs/AUTH_AND_SYNC_VERIFICATION.md](docs/AUTH_AND_SYNC_VERIFICATION.md) for verified security checks and the necessary real-project acceptance tests.

## Checks before launch
See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md). Verify official gallery/photos, page navigation, student and guardian privacy, admission form persistence, receipt/print view, role-restricted admin saves, tablet/mobile layout and the live custom domain. Do not commit real students' data, tokens, or passwords.

## File layout
- `public/`: frontend and images
- `api/`: server-side endpoints
- `pages/`: dashboard pages
- `lib/`: shared server-side modules
- `migrations/`: PostgreSQL migrations
- `hatchable.toml`: Hatchable project settings

All portraits of Shamsul Ulama in `public/assets/` were derived from the user-supplied photographs; no facial features were AI-reconstructed.
