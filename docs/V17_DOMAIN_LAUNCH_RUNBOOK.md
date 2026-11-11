# .com domain readiness — Shamsul Ulama Islamic Academy V17
No domain has been purchased, connected or deployed by these instructions. DO NOT commit secret values.

## Before buying / pointing a domain
1. Confirm the legal/official academy name and owner-authorized `.com` spelling (domain availability and trademarks can change). Owner purchases in an account the Academy controls; keep registrar renewal credentials and DNS access.
2. Select hosting separately after performance/security/price review. A GitHub repository is **source control**, not a hosting provider. A GitHub branch does not generate a public preview URL.
3. Create **separate** staging and production hosting projects; verify all routes, Node 22/Netlify gateway, API and static assets (including `/assets/academy-owner-official-logo.png`). Do not deploy `main` or modify original Hatchable app.
4. Create dedicated, least-privilege Neon QA database for previews. Actual production database migration requires owner approval, test backup + restore and database continuity plan. Never copy student data into staging.
5. Keep keys in host environment/secret manager: `ACADEMY_STAGING_DATABASE_URL`, `ACADEMY_STAGING_SETUP_TOKEN` for QA; configure separate production secrets with a different scheme only at production cutover. Rotate any exposed key. Never commit .env, database dump, private uploads, passwords or credentials.
6. Confirm app uses request-relative same-origin URLs; make all login/logout redirects, parent/student `/journey` and deep links work on both preview and final hostname. Allow only local relative `next` paths, no open redirects.
7. Verify HTTPS/TLS, secure HttpOnly SameSite cookies, canonical hostname redirect (apex vs www), HSTS when ready, CSRF Origin/Host behind proxy, custom domain and subdomain separation, no public session leakage.
8. Configure DNS records **from actual host instructions** at launch (do not guess A/CNAME targets). Decrease TTL before switch; verify HTTPS and www/apex on both mobile and desktop. Keep prior site online while testing, prepare rollback.
9. Ensure domain and hosting renewal billing, media storage and Neon quotas, backups/restore, monitoring, failed-login auditing, media upload size limits, robots/sitemap, brand/logo caching, Arabic font delivery and performance are documented.
10. After QA and explicit owner launch approval, pin tested commit SHA, publish production deploy, verify admission forms and access restrictions, then switch DNS. Avoid editing original production until backed up and migration independently reviewed.

## Acceptance before announcing any updated preview URL
- Preview is on a different host/project from original `https://shamsul-ulama-w2kv.hatchable.site`.
- Confirm deployed revision and a successful public HTTP GET for Home, `/assets/academy-owner-official-logo.png`, login, redirects and API behavior.
- Confirm actual logo art matches owner's official asset, real academy photo is not invented, and `/dashboard` & `/journey` correctly require authentication.
- If only UI is available and backend unverified, label it clearly **visual preview, not production-ready**.
- Never call the old Hatchable production URL the V17 updated preview.

## GitHub source backup
Branch: `development/academy-v17-premium-hifz`.
Original V16 staging branch remains unchanged.
After important milestones: tag/pin commit; create downloadable source ZIP from GitHub; mirror all additive migrations to `netlify/database/migrations/`; retain offline encrypted backups of real DB **outside GitHub** only once separately authorized.
