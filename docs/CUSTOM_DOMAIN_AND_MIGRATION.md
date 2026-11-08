# Custom domain and independent hosting

## Option A — recommended: use a domain on Hatchable (no backend re-platforming)

The academy's current source uses Hatchable-specific server APIs and PostgreSQL. For the lowest-risk domain launch, **connect the intended owner's account/project**, deploy the reviewed version there, and keep the managed backend in place.

1. In ChatGPT, connect **Hatchable with the account that owns** `shamsul-ulama-w2kv`. Confirm the project appears in the connected project list **before any deployment**.
2. Review the owner's project visibility and initial administrator account. Make the public website public in **Hatchable Console → Project Settings** when ready (owner-only step).
3. In the owner's Hatchable project Settings, select **Custom Domains** and add the chosen domain.
4. Follow Hatchable's displayed ownership TXT record and DNS pointing record:
   - A `TXT` record under `_hatchable.<your-domain>` with **the exact verification token given in the console**.
   - Subdomains (for example `www.example.com`) generally use `CNAME` → `cname.hatchable.com`.
   - The root/apex `example.com` uses the Hatchable-specified A record or compatible ALIAS/ANAME record. **Do not guess a server IP**; use the value shown by Hatchable.
5. Wait for validation and HTTPS. Test **both www and root separately**, redirect preferences, deep links (`/about`, `/shamsul-ulama-legacy`, `/admission`), mobile navigation, login, forms, cookies and SSL.
6. Set up monitoring/backups and verify Google Maps, all public contact methods and other Academy content.

**Plans:** Hatchable's pricing documentation states custom domains are on the Builder plan; the Free tier has no custom-domain allowance. Confirm the account's current eligibility before purchase.
Official documentation: https://hatchable.com/features/domains and https://hatchable.com/pricing.

## Option B — move the ZIP to a different hosting provider

This is **not** a drag-and-drop static hosting project. The source repository is a faithful code backup but relies on Hatchable-specific imports/services and routing. A separate hosting provider requires:
- Implement or replace the Hatchable SDK interfaces (`db`, auth/session handling, storage, API routing, settings, and any platform services used).
- Provision a PostgreSQL instance, apply migrations in order, and export/import production data with verified backups **privately**, never into public GitHub.
- Implement secure environment/secrets configuration, HTTPS-only cookies, CSRF, rate limiting, role-scoped access, and secure file upload/storage.
- Configure the server to serve the static `public/` directory, route `/api/*` to equivalent backend functions and provide correct SPA fallback for nested public URLs.
- Run complete acceptance tests with owner-provided test accounts, including signup/setup, Usthad add student, admission review/print, private month and Juz writes, student/guardian read limits, forms and data persistence.
- Set DNS as required by the new host, check certificate and redirect settings, and run a post-migration security and privacy review.

**A ZIP alone does not transfer account passwords, database records or running backend functionality.** Never assume the transfer is production-ready without these steps.

## Source ZIP

The public GitHub repository can always be downloaded as a single source archive through **Code → Download ZIP**:
https://github.com/darulswalathhifzulquran-sketch/shamsul-ulama-academy/archive/refs/heads/main.zip

The GitHub Actions workflow `source-package.yml` also packages a versioned source artifact when Actions are enabled. The ZIP is a source backup; it is not a guarantee of deployment to another hosting provider.
