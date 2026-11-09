#!/usr/bin/env node
// Static safety checks only. These are NOT authenticated end-to-end backend tests.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const read = p => readFileSync(p, 'utf8');
function walk(root) {
  return readdirSync(root).flatMap(name => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
const backends = [...walk('api'), ...walk('lib'), ...walk('pages')].filter(p => p.endsWith('.js'));
for (const path of backends) {
  const content = read(path);
  assert(!/from\s+['"]hatchable['"]/.test(content), 'Hatchable import remained: ' + path);
  assert(!/from\s+['"]lib\//.test(content), 'Hatchable-only import path remained: ' + path);
}
const gateway = read('netlify/functions/academy.js');
const routes = [
 'api/identity/bootstrap', 'api/identity/login', 'api/identity/logout',
 'api/identity/me', 'api/identity/change-password',
 'api/academy/accounts', 'api/academy/applications', 'api/academy/application-print',
 'api/academy/enquiries', 'api/academy/gallery', 'api/academy/juz',
 'api/academy/monthly', 'api/academy/overview', 'api/academy/settings',
 'api/academy/students', 'api/academy/students-bulk-delete',
 'api/academy/target', 'staff', 'dashboard'
];
for (const route of routes)
  assert(gateway.includes("'" + route + "'"), 'Missing staging handler: ' + route);
const names = readdirSync('migrations').filter(p => p.endsWith('.sql')).sort();
assert.equal(names.length, 14, 'The app must preserve all 14 SQL migrations');
for (const name of names) {
  const original = read('migrations/' + name);
  const target = read('netlify/database/migrations/' + name);
  assert.equal(original, target, 'Migration contents changed: ' + name);
}
const config = read('netlify.toml');
assert(config.includes('from = "/api/*"') && config.includes('to = "/.netlify/functions/academy?__route=api/:splat"'), 'API routing missing');
assert(config.includes('from = "/staff"') && config.includes('from = "/dashboard"'), 'Dashboard routes missing');
assert(gateway.includes("x-academy-setup-token"), 'Owner-only bootstrap safeguard missing');
const auth = read('lib/academy-auth.js');
assert(auth.includes('SameSite=Strict') && auth.includes('checkCsrf') && auth.includes('guard('), 'Auth/CSRF protections missing');
const source = walk('public');
assert(source.some(p => p.endsWith('assets/site.js')), 'Public site missing');
assert(source.some(p => p.endsWith('assets/staff.js')), 'Staff frontend missing');
const mediaLimit = read('api/academy/gallery.js').includes('16*1024*1024');
assert(mediaLimit, 'Original 16 MiB feature changed or removed');
console.log(JSON.stringify({
  status: 'STATIC_CHECK_PASS',
  api_and_dashboard_routes: routes.length,
  backend_modules: backends.length,
  schema_migrations_exact_copy: names.length,
  frontend_preserved: true,
  native_media_upload_over_4_5_mib: 'NOT VERIFIED - PLATFORM LIMIT REQUIRES SEPARATE SOLUTION',
  actual_database_login_media_e2e: 'NOT TESTED',
  live_hatchable_modified: false
}, null, 2));