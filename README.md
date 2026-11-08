# SHAMSUL ULAMA ISLAMIC ACADEMY

Official source code for Shamsul Ulama Islamic Academy. The intended production Hatchable project `shamsul-ulama-w2kv` is now connected and has received the updated website source. Production data, passwords, and sessions are not included in GitHub.

## Current website source
- Production Hatchable project: `proj_28yiZzMLRLsx` · https://shamsul-ulama-w2kv.hatchable.site
- Older reference project: `proj_nA81ZaknH1Km` · https://shamsul-ulama.hatchable.site
- Original new-project Version 1 remains in Hatchable deployment history. Additional versions have been deployed; check console before further updates.
- Public pages: Home, About, Gallery, Admission, Contact; biography: `/shamsul-ulama-legacy`
- Staff, student and parent dashboard, Hifz Journey, monthly growth reports, academy settings and official admissions

## Update — production project connected (8 Nov 2026)
- New account linked and project confirmed; current deployment history includes versions 1–3.
- Public Home/About, Shamsul Ulama heritage biography, both supplied portraits, and sign-in page were verified on the intended domain.
- Database tables for Academy accounts, students, monthly reports, Juz, applications and sessions answer queries; one Admin account exists, while no Student or Parent accounts have been created yet.
- Anonymous role-protected endpoints return 401; family scoping and published-only SQL queries pass database EXPLAIN checks.
- **Pending:** authenticated Admin/Usthad/Student/Parent browser workflows with real owner-held credentials, test students, published updates, and custom .com DNS/HTTPS. Do not mark all login flows as verified until these pass.

## Download the whole source as one ZIP
Open the green **Code** button in this GitHub repository and choose **Download ZIP**. You can also use the `main.zip` archive:
https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy/archive/refs/heads/main.zip

The ZIP includes application code, publicly committed site assets, migrations and guides. **It does not include private PostgreSQL data, personal user records, live authentication sessions, secrets, nor Hatchable's managed hosting runtime.** A ZIP is a backup/export of code, not a complete independent web server.

## Running on the custom domain
The quickest and safest option for a domain without a backend migration is to keep the app deployed on the correct Hatchable project and add a custom domain in the Hatchable project Settings. See [docs/CUSTOM_DOMAIN_AND_MIGRATION.md](docs/CUSTOM_DOMAIN_AND_MIGRATION.md) for owner-only steps, DNS requirements, and what must change if leaving Hatchable.

## Authentication
The current backend uses `api/identity/*` plus `lib/academy-auth.js` for server-side credential handling, hashed sessions, CSRF and role-scoped access. **There is no hardcoded administrator password.** The production database currently has one existing admin account (`administration`); its password must be set/verified privately by the owner, and no login credentials are committed. Each Hatchable project has its own independent database, which means credentials do not transfer just by copying the source.

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
