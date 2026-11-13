# Shamsul Ulama Islamic Academy

> Hatchable project · slug `shamsul-ulama-w2kv`

_Auto-generated. Don't edit a stored copy by hand — the generator overwrites it on every read or deploy. Source: `app/Services/AgentsManifest.php` + `app/Services/PlatformManifest.php`._

## Read me first — hard constraints

Hatchable rejects code that violates any of these at deploy time. Save yourself a redeploy by checking your output against this list before you call `deploy`:

- **No build step.** No webpack, vite, esbuild, tsc, Babel. Source files = production. CSS via CDN (Tailwind is tolerable — pages degrade to unstyled-but-working). App JS loads from the project's OWN ORIGIN: Alpine or React+`htm` vendored into `public/vendor/` via `import_file_from_url` (UMD builds, loaded as globals) — never runtime module imports from esm.sh/unpkg, which render permanently BLANK for visitors on networks that block those CDNs. See skill `pages/add-react-and-htm-spa`. **No JSX, no `.jsx`, no `.tsx`** — the deploy validator rejects them. React components use `htm` tagged template literals. `package.json` may declare deps (informational), but `scripts.build` is rejected — Hatchable does not run `npm install` and does not run a build.
- **No ORMs.** Use `db.query` with raw parameterized SQL. Drizzle, Prisma, Sequelize, Knex, TypeORM are auto-rejected.
- **No framework imports.** No Next, Remix, SvelteKit, Astro, Nest, Express, Fastify. Hatchable's runtime is its own thing — file-based routing under `api/`, default-export handlers, the `hatchable` SDK. The validators name each rejected import and point at the SDK alternative.
- **No native modules.** No `child_process` / `spawn`, no raw `puppeteer`, no native-binding npm packages. Use the SDK's managed services: `browser`, `ai`, etc.
- **No persistent filesystem between requests.** `/tmp` is wiped. Use `db` or `storage` for durable state.
- **Handler shape is fixed:** every `api/*.js` file must `export default async function (req, res)`. Optional `export const methods = ['GET','POST']` for runtime-handled 405. Next.js-style named HTTP exports (`export async function POST`) are not supported — the runtime errors with `Function module must export a default function (req, res).`
- **Every routed file (`api/*.js` and `pages/*.js`) MUST declare `export const access`** — `'public'` (anonymous OK), `'member'` (any signed-in collaborator), `'admin'` (admin/owner only), or `'scheduler'` (cron-invoked only, 404 to external HTTP). A routed file without it is REJECTED at deploy — **this is the single most common deploy rejection**, so add the line as you write each handler, right next to the default export. Shared code under `lib/` (or `api/lib/`) isn't routed and doesn't need it.
- **`api/auth/*` is a reserved platform namespace.** The platform owns `/api/auth/*` (login, passkeys, sessions) whether `[auth]` is on or not, so a file at `api/auth/...` (or `api/auth.js`) is REJECTED at deploy. Put project-owned identity/account code under `api/account/` instead. Call the platform's auth endpoints from the frontend via `window.hatchable.auth.*`, never by mounting your own `api/auth/` routes.
- **For AI/LLM keys, declare an `[ai]` table — NOT a `[[secret]]` block.** The minimum is two lines: `[ai]` then `required = true`. The platform expands it to every AI provider in its catalog and renders a provider picker; the user pastes their key once at the account level. Narrow with `providers = ["anthropic"]` (a subset) or `pin = "anthropic"` (lock the picker to a single provider). Route between providers at call time via the `model` alias you pass to `ai.generateText` (`'sonnet'` → Anthropic, `'gpt'` → OpenAI, `'gemini'` → Google). **`[[secret]]` no longer declares AI keys: `[[secret]] kind = "ai"` (and the older `kind = "llm"`/`"raw"`) is REJECTED at deploy** — `[[secret]]` is only for app-internal raw values the buyer pastes (HMAC peppers, webhook signing secrets), and every entry needs a `name` (`key` is the accepted legacy alias). Don't hardcode `name = "ANTHROPIC_API_KEY"` either — that locks the user to one provider AND disables the picker. See skill `ai/add-an-llm-endpoint`.
- **For knowledge bases used by RAG, declare `[[knowledge]]` blocks in `hatchable.toml` with `name` (lowercase letters, digits, and underscores only, starting with a letter: `company_docs`, never `company-docs`; a hyphen is REJECTED at deploy and throws at runtime), `description`, `dimensions` (default 1536), and `populated_by = "console"` (default — user uploads in the Knowledge tab) or `"app"` (your code calls `knowledge.add()` itself). Required-and-console entries that aren't populated yet show a "needs action" banner in the console's Knowledge tab so the user knows to fill them in. Don't try to upload knowledge content from agent code — for builder-curated content (docs, FAQ), declare and let the user use the console; for user-generated content (notes, tickets), set `populated_by = "app"` and write `knowledge.add()` calls in your `api/*.js` endpoints.
- **Always populate `intent` and `summary` on every `deploy` call.** They become the user-facing changelog in the console's History view AND the git commit message. `intent` is the user's request in their own words ("Add split-the-bill"); `summary` is your 1–3 sentence plain-language description of what shipped. Without them, the user's history reads as `Deploy v1`, `Deploy v2`, `Deploy v3` — useless for understanding what they built. See skill `ops/deploy-the-project`.

Each of these is a line in the deploy validator's anti-pattern checks. The full list with remediation is in the **Deploy validators** section below.

## What is Hatchable

A serverless platform for full-stack web apps.

- **Code** in `api/` runs in V8 isolates. In-memory module state isn't
  guaranteed to survive between requests; for durable state use `db`
  or `storage` from the SDK.
- **Database** is per-project Postgres, queried with raw SQL via
  `db.query`. (See "Read me first" above for why ORMs aren't an option.)
- **Frontend** ships as static files with no build step. CSS may load
  from a CDN (Tailwind is tolerable); app JS loads from the project's
  OWN ORIGIN — vendor Alpine or React + `htm` into `public/vendor/`
  via `import_file_from_url` (UMD builds, loaded as globals), never
  runtime module imports from esm.sh/unpkg. See skill
  `pages/add-react-and-htm-spa` for the canonical React shape.
- **Heavy work** (chromium, model calls, image transforms, durable
  queues) routes through the SDK to managed services. Don't try to
  spawn chromium or import provider SDKs directly — the deploy
  validator rejects them and points at the SDK module.
- **Visibility: every project starts personal (private).** The live
  URL — every path, `/api/*` included — shows a Hatchable sign-in
  wall to everyone except the owner and collaborators. Verify the
  visitor experience with the stranger-view `preview_url` from
  `deploy` (or mint one with `create_preview_link`); it expires in 30
  minutes and never makes anything public. Opening the app to the
  world is a console Settings action ONLY the user can take — no MCP
  tool can do it, so when an app is meant for public visitors, tell
  the user that final step is theirs.

## House design — the default look of everything you build

When the user hasn't given their own design direction, this is the standing default for every visual surface you ship — pages, components, dashboards, emails. **If they give explicit design instructions, theirs win.**

The goal is NOT to make every app look the same. It's to make each app look **intentional and right for its purpose** — never the bland average of generic AI templates. The most common failure is defaulting to the safe middle of every genre at once (system font, gray cards, centered hero, one soft shadow). **That middle is the slop.** Anchor on how the best people in the world have designed this exact kind of thing, then commit.

**Step 1 — Read the context.** Personal or professional? What domain (travel, finance, health, dev tooling, kids, commerce, creative)? What emotional register (joyful, calm, focused, serious, playful, premium, raw)? What audience and device? Match them — never "playful" for funeral planning, never "toy-like" for tax software.

**Step 2 — Anchor on the best, then synthesize (the core move).**

1. **Name 2–3 genuinely well-designed real exemplars** of this exact kind of product — well-designed, not merely famous (trip itinerary → Wanderlog, Airbnb Trips; data app → Linear, Stripe, Vercel; journal → Things, Bear, Day One; commerce → Aesop, Glossier; dev tool → Linear, Railway, Resend).
2. **Articulate WHY they're great, as concrete decisions** — "Linear = restrained monochrome, keyboard-first density, hairline structure, near-zero chrome"; "Stripe = confident type scale, generous whitespace, one bold accent, crisp grid." Converting the memory into specific decisions is what actually drives the output.
3. **Synthesize an ORIGINAL design from those principles — do not clone.** Channel the *qualities*, not the pixels or the brand identity. The goal is "as well-designed as Linear," not "indistinguishable from Linear." Cloning produces derivative knockoffs and trade-dress risk at scale.
4. **If no strong exemplar comes to mind,** fall back to the genre presets in the skill and design from first principles against the quality floor.

**Universal NEVERs**

- ❌ System font / Inter as the intended primary typeface
- ❌ Default Tailwind blue/indigo/slate; purple→pink gradient on white
- ❌ Centered hero + centered card as the automatic layout
- ❌ Pixel-cloning a named brand's identity (channel principles, build original)
- ❌ The "safe middle of every genre" — blandness is the failure mode

This condensed core applies **even if you read no skills.** The full genre presets (Utilitarian Tool, Warm Editorial, Playful/Toy, Refined Luxury, Soft/Calm, Brutalist/Raw, Corporate Trust) and the quality floor (typography, color, space, motion, icons) live in skill `design/apply-house-design` — read it (`read_skill('apply-house-design')`) before building any substantial UI.

## Skills

Discrete how-to guides — one pattern each. When you're about to do something on this platform, skim the registry below and load any that look relevant.

Three ways to consume them:

- **MCP resources** (preferred for context-attaching clients): each skill is exposed as `hatchable://platform/skills/{category}/{name}`. The full skill registry is at `hatchable://platform/skills/_index`.
- **MCP tools** (for in-loop reasoning): `list_skills(query?, tag?)` returns the registry as structured data; `read_skill(name)` returns the full markdown body.
- **Reading the file system** (for clients with repo access): every skill is a markdown file under `/skills/{category}/{name}.md`.

Registry (auto-generated from `/skills/`):

### Admin
- **recognize-the-project-admin** — Gate an admin-only route to the project's owner (or any admin collaborator) without building a login form or an app-level users table.

### AI
- **add-a-knowledge-base** — A knowledge base is the storage half of RAG: put text + metadata, query by semantic similarity (pgvector embeddings).
- **add-an-llm-endpoint** — Scaffold a route that takes a prompt, calls a language model, and returns the response.
- **add-rag-search** — Retrieval-augmented generation: index your content as embeddings, retrieve the top-K relevant chunks for a query, pass them to the LLM as context.
- **build-an-agent-with-tools** — Define tools the model can call, pass them to `ai.generateText` with `maxSteps`, and the runtime drives the loop: model picks a tool → your…
- **inspect-llm-call-history** — Every `ai.generateText` / `ai.streamText` / `ai.embed` / `ai.fetch` call is logged to the platform's AI ledger automatically — model…
- **show-ai-spend** — Every `ai.generateText` / `ai.streamText` / `ai.fetch` / `ai.generateImage` call writes a priced row into the platform's `ai_call_logs`.
- **use-a-provider-directly** — `ai.fetch` escape hatch for what `generateText` doesn't cover: image generation, audio, files, batches, prompt caching, or any new endpoint…

### API
- **access** — Every API route and MCP tool on Hatchable must declare who can call it.
- **add-an-api-route** — File-based routing under `api/`.
- **proxy-an-external-api** — Call third-party APIs from server-side handlers, never from the browser.
- **scheduler** — Routes declared `access: 'scheduler'` are invoked only by the platform's scheduler — `[[cron]]` blocks in `hatchable.toml` or runtime…
- **stream-a-response** — Send a response as it is produced instead of all at once: tokens from a model as they arrive, progress events from a long job, a large export row by row.

### Auth
- **add-google-signin** — Google sign-in for the app's END USERS (the `[auth]` plane — not project collaborators).
- **build-a-login-page** — Ship your own `/login` page as part of enabling `[auth]` — styled like YOUR app, wired to the platform's auth client.
- **enable-app-auth** — Give your app its own sign-up/sign-in for end users — people who find the app and create an account themselves, as opposed to collaborators you invite.
- **gate-an-endpoint** — Require a signed-in caller before a route runs — login handled by the platform: `export const access = 'member'` for collaborators…
- **handle-the-anonymous-case** — Serve one public route to both signed-in users and anonymous visitors — check `req.member` and vary the response.
- **handle-user-deletion** — When the project owner deletes an end user from the console's Users tab, the platform runs a deletion ceremony: it revokes that user's AI…

### Background
- **add-a-cron-job** — Schedule a recurring API route via `[[cron]]` blocks in `hatchable.toml`.
- **add-a-scheduled-digest** — Composite pattern: cron job fires on schedule, queries the database for what to send, calls `email.send` for each recipient.
- **defer-with-scheduler** — `scheduler.at(when, route, opts?)` arms a one-shot or recurring fire of any `api/*.js` route.

### Browser
- **scrape-a-page** — `browser.session` runs a function with a Chromium page instance, letting you navigate, fill forms, click, and extract data.
- **take-a-screenshot** — `browser.screenshot(url)` returns a PNG buffer of any URL rendered by managed Chromium.

### Config
- **declare-configurable-fields** — Expose buyer-editable settings without building an admin UI.
- **read-config-values** — Read buyer-editable settings declared via `[[config]]` in `hatchable.toml`.

### Data
- **add-a-table** — Create a Postgres table with a SQL migration — the platform applies `migrations/*.sql` in filename order on deploy; once applied, a…
- **one-off-backfill** — Run a data migration that fires once on deploy and never again.
- **query-with-pagination** — Paginate SQL queries with keyset cursors on `id`/`created_at` instead of OFFSET — stable and fast on Postgres.
- **row-access** — 
- **transactions** — Run multiple SQL writes atomically with `db.transaction` on the project's Postgres database.
- **write-a-safe-migration** — Migrate Postgres schema safely, and define the project's functions, procedures and triggers — a migration is the only place a routine can be created.

### Design — house art direction, applied by default
- **apply-house-design** — Apply this when a user building on Hatchable has **not specified their own design direction**.

### Email
- **send-transactional-email** — `email.send` for one-off transactional messages — receipts, confirmations, password resets, digests.

### Integrations
- **connect-an-external-api** — Talk to Reddit, GitHub, Notion, Linear, Slack, or any other HTTP API from a Hatchable handler without writing OAuth flow code or storing tokens yourself.
- **verify-a-webhook** — Verify inbound webhook signatures (Stripe, GitHub, Shopify, Slack) with `webhooks.verifyHmac` — constant-time, replay-window safe.

### MCP
- **expose-an-mcp-tool** — Let an AI client (Claude, ChatGPT, Cursor, etc.) call your project's logic directly.

### Meta — telling Hatchable about Hatchable
- **file-platform-feedback** — Hatchable is built on top of an isolate runtime, an SDK, an MCP layer, a deploy pipeline, and a docs corpus — all of which have rough edges.
- **platform-constraints** — Hatchable is not a typical Node host.

### Ops
- **debug-a-failing-deploy** — When `deploy` returns an error, the message names the issue and points at the fix.
- **deploy-the-project** — `deploy` MCP tool ships the current state of project files to production.
- **inspect-the-schema** — Read the live Postgres database schema (tables, columns, indexes) with `get_schema`, and run ad-hoc SQL with `execute_sql`, before writing migrations.
- **read-the-logs** — Debug production errors: `view_logs` returns request logs, console output, and handler errors, filtered by route, level, time, or full-text.

### Pages
- **add-a-form-and-handle-it** — The standard form pattern: Alpine state on the page, `fetch` POST to an `/api/...` route, JSON response, redirect or update inline.
- **add-a-page** — Build an HTML page using Tailwind CSS (via CDN) and Alpine.js (via CDN) for interactivity.
- **add-react-and-htm-spa** — When client state genuinely demands React — multi-step forms, real-time dashboards, drag-and-drop, complex data grids — **vendor React +…
- **server-render-a-page** — Serve dynamic HTML at a clean URL.
- **share-design-tokens** — Define brand colors, fonts, spacing, and radii once in `/theme.css` and reference them across all pages.
- **write-host-aware-urls** — An app can answer on several hostnames: its `{slug}.hatchable.site` subdomain plus any custom domains the owner has added.

### Project
- **export-project-data** — Pull the project's data and files for backup, off-platform analysis, or migration.
- **fork-from-canonical** — Forking creates a new project as a copy of an existing one — files, schema, seed data, all of it.
- **handle-agent-tasks** — Read and resolve the plain-English agent tasks a project's owner filed in their console, and close them with the deploy that fixed them.
- **set-environment-variables** — Declare secrets, env config, and API keys in `hatchable.toml` (`[[secret]]`, `[[config]]`, `[ai]`); read them with `config.get`.

### Realtime
- **publish-and-subscribe** — Live updates without polling loops.

### Storage
- **accept-a-file-upload** — Accept multipart/form-data uploads, store the file via `storage.put`, and hand the browser a short-lived presigned URL.
- **expire-files-with-tmp** — Any `storage.put` whose key starts with `tmp/` gets auto-deleted by S3 ~7 days after it was written.
- **serve-stored-files** — Serve private stored files to browsers via signed URLs, stable redirects, or streamed bytes — four patterns with `storage.url`/`storage.get`.

## Handler shape

Every file in `api/` exports one default handler. Method dispatch is
inside the handler — there's no `export async function POST(...)` per-
method pattern. The runtime calls the default export with `(req, res)`
regardless of HTTP method.

```js
import { db, auth } from 'hatchable';

export default async function (req, res) {
  if (req.method === 'GET') {
    const r = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50');
    return res.json({ posts: r.rows });
  }

  if (req.method === 'POST') {
    const user = await auth.requireUser(req, res);
    if (!user) return;   // requireUser already wrote a 401

    const { title, body } = req.body;   // already-parsed JSON; no `await`
    if (!title) return res.status(400).json({ error: 'title required' });

    const r = await db.query(
      'INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3) RETURNING id',
      [user.id, title, body || '']
    );
    return res.status(201).json({ post: r.rows[0] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
```

**`req` shape:**
- `req.method` — `'GET' | 'POST' | …`
- `req.params` — path params from `[bracketed]` segments
- `req.query` — query string params
- `req.headers` — lowercased keys
- `req.body` — already parsed (JSON, form-urlencoded, or multipart fields). NOT awaitable.
- `req.files` — array of `{ field, filename, contentType, buffer }` for multipart uploads (worker tier only)
- `req.cookies` — parsed cookies map (don't read for auth — use `auth.getUser`)

**`res` shape:** `res.status(code)` (chainable), `res.json(obj)`, `res.send(string|Buffer)`, `res.setHeader(name, value)`, `res.redirect(url, code?)`.

## File conventions

File-based routing. Path determines the URL.

| Path pattern | What it becomes |
|---|---|
| `api/users.js` | `/api/users` |
| `api/users/[id].js` | `/api/users/:id` (id available as `req.params.id`) |
| `api/docs/[...path].js` | `/api/docs/*path` (catch-all; `req.params.path` is `string[]`) |
| `api/index.js` | `/api` (root) |
| `api/users/index.js` | `/api/users` |
| `migrations/*.sql` | Applied at deploy in lexical order. Forward-only. |
| `public/*` | Static assets served at the same path |
| `hatchable.toml` | Project-level config: `[auth]`, `[ai]`, `[[cron]]`, `[[secret]]`, `[[api]]`, `[[config]]`, `[mcp]`. (Custom domains are managed in the console, not here.) |
| `package.json` | **Validated at deploy.** Framework/ORM deps and `scripts.build` are rejected (see the deploy validators). Hatchable does not run `npm install`. |

**Cron scheduling:** add `export const schedule = "0 * * * *"` to a handler, OR add a `[[cron]]` block in `hatchable.toml` with `path = "/api/..."` and `schedule = "..."`. The key is `path` (NOT `route` — a `route =` entry is silently ignored and never fires). One schedule per route. Minimum granularity is hourly for every project.

**Naming for migrations:** `NNNN_description.sql` where NNNN is a zero-padded sequence number. Migrations run in lexical order, once per database.

## SDK modules

All capabilities import from one namespace:

```js
import { db, auth, admin, email, storage, scheduler, events,
         ai, knowledge, browser, config } from 'hatchable';
```

| module | what it does |
|---|---|
| `db` | `db.query(sql, params)` → `{ rows, rowCount }`. `db.transaction([{ sql, params }, …])`. Always parameterize (`$1, $2`); never string-interpolate user input. |
| `auth` | `auth.requireUser(req, res)` → user or null (auto-401). `auth.getUser(req)` → user or null. Both return null when `[auth]` is not enabled. App-level identity only. |
| `admin` | `admin.check(req)` → boolean. `admin.require(req, res)` → gates a route (302 to console login if no session, 403 if signed in but not the project owner). `admin.profile(req)` → `{ handle, email }` or null. Recognizes the project owner via the platform `hatchable_session` cookie — distinct from `auth` (app-level user identity). The right call for `/admin/*` routes inside your app when the buyer is the only admin and end-users are anonymous. |
| `config` | `config.get(key)` → resolves `[[config]]` buyer-saved value → this project's `[[secret]]` value (pasted, or granted from the owner's account vault) → `[[config]]` schema default → null. Saves are live without redeploy. Distinct read surfaces: `config.get` is name-only; `process.env` only carries secrets declared with `expose = true`. |
| `email` | `email.send({ to, subject, html, text, from? })`. Verified-from-domain required. |
| `storage` | `storage.put(key, buf, contentType)` → short-lived presigned URL (default 1h). `storage.get(key)` → `{ buffer, contentType }` (in-handler bytes; no URL). `storage.url(key, { ttl? })` → fresh presigned URL (default 1h, max 7d). `storage.del(key)`. `storage.list(prefix, { cursor?, limit?, include_metadata? }?)` → `{ items, next_cursor }` — pass a response's `next_cursor` back as the `cursor` option to page. Bucket is fully private; every read goes through a signed URL or `storage.get`. No permanent public URL — call `storage.url(key)` before each browser-facing render. |
| `scheduler` | `scheduler.at(when, route, { payload?, name? })`. `when` = 5-field cron string for recurring, or Date/ISO/epoch for one-shot. `scheduler.cancel(taskId)`. |
| `events` | `events.publish(channel, event, payload)` — push a realtime event to subscribed browsers (JSON ≤64KB, rate-limited, fire AFTER the write commits). `events.grant(channels, { ttl? })` → `{ token }`, returned by YOUR token route (conventionally `api/events-token.js`) — the token is the ONLY way clients subscribe, so channel authz is your code's decision like row access. Client side: `<script src="/__hatchable/events.js">` then `hatchable.events.connect().channel(name).on(event, cb)` — the lib owns transport, reconnect, and replay; never hand-roll an EventSource or poll loop around it. Read skill `realtime/publish-and-subscribe` first. |
| `ai` | `ai.generateText({ model, prompt | messages, system?, tools?, maxSteps?, purpose?, userId? })` → `{ text, toolCalls, finishReason, usage, model, steps }`. Pass either `prompt` (string, single-user-message shortcut) or `messages` (array, multi-turn). With `tools` carrying `execute` functions and `maxSteps > 1`, the runtime drives the agent loop. `ai.streamText(opts)` → AsyncIterator. `ai.embed(input, { model? })` → `{ embedding | embeddings, usage }`. Provider-family aliases: `sonnet`/`haiku`/`opus`/`gpt`/`gpt-mini`/`gemini`/`gemini-flash`. Every call is logged to the platform AI ledger; pass `purpose` to label it and read spend back with `ai.usage({ window? })` (includes `spend_today_usd` / `daily_limit_usd`). Each project has a daily AI spend cap ($10 default, owner-adjustable in console Settings) protecting the BYOK key from runaway usage — at the cap, calls fail with `error_code: "ai_spend_limit_reached"` until midnight UTC; handle it gracefully in user-facing routes. |
| `knowledge` | `knowledge.base(name, { dimensions, metric? })` returns `{ add(items), addByVector(items), search(query, opts?), searchByVector(embedding, opts?), remove(ids), table() }`. RAG-shaped API: `add()` embeds + stores text in one call, `search(query)` embeds the query and returns nearest matches as `[{ id, similarity, metadata }]`. Each item is `{ id, text, metadata? }`. Idempotent declare on first call. Backed by pgvector on the project DB. |
| `browser` | `browser.html(url)`, `browser.pdf(url, opts?)`, `browser.screenshot(url, { width?, height?, fullPage? })` (always PNG), `browser.session(async page => { … })` for stateful Puppeteer-style flows. |

For *how to use* any of these in a real flow, read the matching skill (`ai/add-an-llm-endpoint`, `ai/add-a-knowledge-base`, etc.). The table above is the reference; skills are the recipe.

## Deploy validators (what gets rejected)

The deploy pipeline rejects code that fights the platform's defaults.
Each rejection points at the canonical alternative.

**Missing `export const access` (most common rejection)** — every routed
file (`api/*.js`, `pages/*.js`, `mcp/*.js`; not `lib/`) must declare
`export const access = 'public' | 'member' | 'admin' | 'scheduler'`
(tools also allow `'user'` but never `'scheduler'`). Add the line next
to the default export as you write each handler. See skill `api/access`.

**AI keys declared as a `[[secret]]`** — there is no `kind` field on
`[[secret]]`; declaring one fails the deploy. Declare an `[ai]` table with
`required = true` instead. `[[secret]]` is only for app-internal raw values
and each entry needs a `name` (`key` is the accepted legacy alias). See skill `ai/add-an-llm-endpoint`.

**Build tools (`package.json` dependency)** — rejected:
`react`, `react-dom`, `next`, `vue`, `svelte`, `@sveltejs/kit`, `nuxt`,
`@remix-run/dev`, `vite`, `webpack`, `rollup`, `esbuild`. Load deps
from CDNs at runtime instead — see skill `pages/add-react-and-htm-spa`.

**ORMs (`package.json` dependency or `import` anywhere in `api/`/`lib/`)** — rejected:
`drizzle-orm`, `prisma`, `@prisma/client`, `knex`, `sequelize`,
`typeorm`, `mongoose`. Use `db.query` with raw SQL.

**Build scripts (`package.json` `scripts.build`)** — rejected. There is
no build step.

**TypeScript files in `api/` or `public/` (`.ts`, `.tsx`)** — rejected.
Use plain `.js` with JSDoc for types.

**npm SDKs that have a Hatchable equivalent** — rejected with redirect:

| If you reached for… | Use this instead |
|---|---|
| `puppeteer`, `puppeteer-core`, `playwright` | `browser` (`browser.html / pdf / screenshot / session`) |
| `@anthropic-ai/sdk`, `openai`, `ai` (Vercel SDK) | `ai` (`ai.generateText`, `ai.streamText`, `ai.embed`) — same shape, gateway routes BYOK |
| `pg`, `pg-promise`, `postgres`, `mysql`, `mysql2` | `db` (`db.query`) |
| `sharp`, `jimp`, `@squoosh/lib` | `browser.screenshot` for HTML→image; for other image work, render server-side via your provider's API |
| `bullmq`, `bull`, `bee-queue`, `agenda` | `scheduler.at(when, route)` for one-shot deferred fires; `[[cron]]` for recurring |
| `ioredis`, `redis`, `@upstash/redis` | `db` (use a Postgres table — Redis clients aren't available) |
| `nodemailer`, `@sendgrid/mail`, `resend`, `@aws-sdk/client-ses` | `email.send` |
| `@aws-sdk/client-s3`, `aws-sdk`, `@google-cloud/storage` | `storage.put` |
| `fs.writeFile` / `appendFile` / `createWriteStream` | `storage.put` (no persistent FS) |
| `child_process` | not available; use `browser` for headless Chromium |

**Reserved namespaces:**

- **`/api/auth/*`** is reserved unconditionally. Files under `api/auth/`
  are rejected at deploy whether or not `[auth]` is enabled. Use
  `api/account/`, `api/identity/`, etc. for project-owned auth code.
- **Reserved tables** when `[auth]` is enabled: `users`, `sessions`,
  `verifications`, `passkeys`, `accounts`, `invited_users`. `CREATE TABLE`
  and `DROP TABLE` on these are rejected; `ALTER TABLE` to add columns is
  fine.

For debugging a failing deploy, see skill `ops/debug-a-failing-deploy`.

## Tell us when the platform fails you

Hatchable has rough edges — undocumented limits, misleading errors, missing helpers, stale docs. **When you hit one during this build, call `submit_platform_feedback`.** Reports go straight into the platform team's triage queue and turn into bug fixes, doc updates, or explicit "won't fix" decisions. Your future self (and every other agent) builds on a better platform because of it.

When to call: any time a platform constraint, undocumented limit, misleading error, missing helper, or stale doc cost you more than ~5 minutes — OR any time you reached for a non-obvious workaround future builds shouldn't have to rediscover. **File mid-build, right after the workaround works** — the painful details fade fast.

```js
submit_platform_feedback({
  severity: 'blocker' | 'friction' | 'polish',
  area:     'isolate' | 'sdk' | 'gateway' | 'scheduler' | 'storage' | 'browser' | 'ai' | 'mcp' | 'docs' | 'dry-run' | 'console' | 'other',
  title:    "One-sentence headline. Specific.",
  body:     "What you tried, the error, the workaround.",
  what_worked: "(optional) something that worked unusually well — helps us avoid breaking it",
})
```

Read `skills/meta/file-platform-feedback.md` (`read_skill('file-platform-feedback')`) for full guidance on what makes a good report.

**Don't** use this for app-level bugs in the user's code, or anything you found by skimming when `list_skills` would have shown the answer. Use it for things that cost real time to figure out and would cost the next agent the same.

## Current project state

Snapshot at the time of this read. The project's last deploy was version `37`.

### Tables in this project's database

_(no tables yet — add `migrations/0001_init.sql` to define schema)_

### Environment variable keys

(Values are not exposed — key names only. Most are read at runtime via the SDK (e.g. `ai.generateText()` resolves provider keys server-side). Only `[[secret]]` entries with `expose = true` reach `process.env`. Declare in `hatchable.toml`; humans paste via the setup gate.)

_(no env vars set: declare values in `hatchable.toml` under `[[secret]]`; the owner sets them on the project's Setup page in the console)_

### Active functions

- `__page-dashboard` (ANY) → `/__page/dashboard`
- `__page-journey` (ANY) → `/__page/journey`
- `__page-staff` (ANY) → `/__page/staff`
- `api-academy-accounts` (ANY) → `/api/academy/accounts`
- `api-academy-application-print` (ANY) → `/api/academy/application-print`
- `api-academy-applications` (ANY) → `/api/academy/applications`
- `api-academy-enquiries` (ANY) → `/api/academy/enquiries`
- `api-academy-gallery` (ANY) → `/api/academy/gallery`
- `api-academy-home-video` (ANY) → `/api/academy/home-video`
- `api-academy-juz` (ANY) → `/api/academy/juz`
- `api-academy-juz-bulk` (ANY) → `/api/academy/juz-bulk`
- `api-academy-media-file` (ANY) → `/api/academy/media-file`
- `api-academy-media-placements` (ANY) → `/api/academy/media-placements`
- `api-academy-monthly` (ANY) → `/api/academy/monthly`
- `api-academy-overview` (ANY) → `/api/academy/overview`
- `api-academy-revision` (ANY) → `/api/academy/revision`
- `api-academy-settings` (ANY) → `/api/academy/settings`
- `api-academy-site-photos` (ANY) → `/api/academy/site-photos`
- `api-academy-students` (ANY) → `/api/academy/students`
- `api-academy-students-bulk-delete` (ANY) → `/api/academy/students-bulk-delete`
- `api-academy-target` (ANY) → `/api/academy/target`
- `api-identity-bootstrap` (ANY) → `/api/identity/bootstrap`
- `api-identity-change-password` (ANY) → `/api/identity/change-password`
- `api-identity-login` (ANY) → `/api/identity/login`
- `api-identity-logout` (ANY) → `/api/identity/logout`
- `api-identity-me` (ANY) → `/api/identity/me`
- `api-identity-recover-admin` (ANY) → `/api/identity/recover-admin`

### Scheduled tasks

_(no scheduled tasks)_

## Deploy

Use the platform MCP `deploy` tool. **Always populate `intent` and
`summary`** — they become the user-facing changelog in the console's
History view and the git commit message:

```json
{
  "tool": "deploy",
  "arguments": {
    "project_id": "proj_28yiZzMLRLsx",
    "intent":  "What the user asked for, in their own words.",
    "summary": "Plain-language description of what you did. 1–3 sentences."
  }
}
```

- `intent` is the USER's request, lightly paraphrased (e.g. _"Add a
  split-the-bill section"_, _"Make the buttons rounder"_, _"Fix the
  0% tip bug"_). For autonomous maintenance with no prompting user,
  leave `intent` empty.
- `summary` is YOUR plain-language explanation of what shipped (e.g.
  _"Created a SplitBill component with a member counter and
  per-person breakdown. Updated the main page to switch between solo
  and split modes."_). The user will read this a week from now to
  remember what they built — write so a future-them with no context
  understands.

For a sanity check first, use `dry_run_deploy` — same validators, no
publish. See skill `ops/deploy-the-project` for the full deploy story
and `ops/debug-a-failing-deploy` for handling rejections.

### Per-file edit `reason` (optional)

`write_file`, `write_files`, `patch_file`, and `delete_file` accept an
optional `reason` string. Use it ONLY when an edit's purpose
meaningfully diverges from the deploy's parent intent — e.g. _"bumped
vue 3.4 → 3.5 to fix the reactivity bug"_ on a package.json edit
during an unrelated feature deploy. Don't add a `reason` when it
would just restate the deploy intent — that's noise.

A successful deploy returns a deployment record with status, version,
and the live URL. Failures return an `errors` array with file-precise
messages.

### Deploy is what changes the live site

A deployed project serves the code captured at its last deploy —
static files, `api/`, `pages/`, and MCP tools as one atomic version.
Writing files changes nothing a visitor sees until you call `deploy`.
Test work-in-progress with `run_function` / `run_code` (always execute
the latest written files) or on `{slug}-draft.hatchable.site` (serves
the latest WIP, owner/collaborator-gated). Batch edits to a working
state and deploy once — don't deploy per-file to "make it take".
Before the first deploy the live URL serves nothing (a 404 that says
the app is not deployed yet); the -draft URL shows the work.

### Drafts vs live

When the project's `auto_promote_drafts` setting is OFF,
your deploy lands as a **draft** at
`{slug}-draft.hatchable.site` and waits for the user to click
"Promote to live" in the console. The response includes `is_draft`
and `draft_url` so you can tell the user where to preview it. Don't
try to "auto-promote" anything from the agent side — that's a
human's call.

## Where to look when this file isn't enough

- **Skills** are the primary "how do I do X" reference. The MCP server lists each one as a `hatchable://platform/skills/{category}/{name}` resource. The `list_skills(query?, tag?)` and `read_skill(name)` tools cover the same content for clients that don't surface resources to the model.
- **SDK source** is the ground truth for any behavior described above. Skills cite it; this manifest paraphrases. Disagreements: trust the SDK (`runtime/worker/sdk/*.mjs`).
- **Other MCP tools:** `deploy`, `dry_run_deploy`, `view_logs`, `get_schema`, `execute_sql`, `read_file`, `write_file`, `patch_file`, `grep`. List the full set with `tools/list`.
- **Roadmap and rationale:** `docs/PLATFORM_ROADMAP.md` in the Hatchable repo.

This document is auto-generated. Don't edit a stored copy by hand — the regenerator overwrites it on every read or deploy. The generator lives at `app/Services/PlatformManifest.php` (static) and `app/Services/AgentsManifest.php` (per-project composition).
