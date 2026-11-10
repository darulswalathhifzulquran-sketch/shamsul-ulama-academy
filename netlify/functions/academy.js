// Staging API gateway — preserves existing Academy handlers and request/response shapes.
// Netlify rewrite rules direct /api/* and /staff /dashboard to this function.
import bootstrap from '../../api/identity/bootstrap.js';
import login from '../../api/identity/login.js';
import logout from '../../api/identity/logout.js';
import me from '../../api/identity/me.js';
import changePassword from '../../api/identity/change-password.js';
import accounts from '../../api/academy/accounts.js';
import applications from '../../api/academy/applications.js';
import applicationPrint from '../../api/academy/application-print.js';
import enquiries from '../../api/academy/enquiries.js';
import gallery from '../../api/academy/gallery.js';
import juz from '../../api/academy/juz.js';
import monthly from '../../api/academy/monthly.js';
import overview from '../../api/academy/overview.js';
import settings from '../../api/academy/settings.js';
import students from '../../api/academy/students.js';
import bulkDelete from '../../api/academy/students-bulk-delete.js';
import target from '../../api/academy/target.js';
import revision from '../../api/academy/revision.js';
import staffPage from '../../pages/staff.js';
import dashboardPage from '../../pages/dashboard.js';
import { db, storage } from '../../lib/academy-runtime.js';
import { getAccount } from '../../lib/academy-auth.js';
import { handleChunkUpload } from '../../lib/academy-chunk-upload.js';

const handlers = {
  'api/identity/bootstrap': bootstrap,
  'api/identity/login': login,
  'api/identity/logout': logout,
  'api/identity/me': me,
  'api/identity/change-password': changePassword,
  'api/academy/accounts': accounts,
  'api/academy/applications': applications,
  'api/academy/application-print': applicationPrint,
  'api/academy/enquiries': enquiries,
  'api/academy/gallery': gallery,
  'api/academy/juz': juz,
  'api/academy/monthly': monthly,
  'api/academy/overview': overview,
  'api/academy/settings': settings,
  'api/academy/students': students,
  'api/academy/students-bulk-delete': bulkDelete,
  'api/academy/target': target,
  'api/academy/revision': revision,
  staff: staffPage,
  dashboard: dashboardPage
};
const allowedMethods = {
  'api/identity/bootstrap': ['GET','POST'],
  'api/identity/login': ['POST'],
  'api/identity/logout': ['POST'],
  'api/identity/me': ['GET'],
  'api/identity/change-password': ['POST'],
  'api/academy/accounts': ['GET','POST','PUT','DELETE'],
  'api/academy/applications': ['GET','POST','PUT'],
  'api/academy/application-print': ['GET'],
  'api/academy/enquiries': ['GET','POST','PUT'],
  'api/academy/gallery': ['GET','POST','PUT','DELETE'],
  'api/academy/juz': ['GET','POST'],
  'api/academy/monthly': ['GET','POST'],
  'api/academy/overview': ['GET'],
  'api/academy/settings': ['GET','POST'],
  'api/academy/students': ['GET','POST','PUT','DELETE'],
  'api/academy/students-bulk-delete': ['DELETE'],
  'api/academy/target': ['GET','POST'],
  'api/academy/revision': ['GET','POST'],
  'api/academy/media': ['GET'],
  'api/academy/gallery-chunks': ['POST', 'PUT'],
  staff: ['GET'], dashboard: ['GET']
};
function makeResponse() {
  let code = 200, body = '', headers = new Headers();
  return {
    status(n) { code = n; return this; },
    setHeader(k, v) { headers.set(k, String(v)); return this; },
    json(o) { headers.set('Content-Type', 'application/json; charset=utf-8'); body = JSON.stringify(o); return this; },
    send(v) { body = String(v ?? ''); return this; },
    redirect(where) { code = 302; headers.set('Location', where); body = ''; return this; },
    finalize() {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(body, { status: code, headers });
    }
  };
}

function headersObject(request) {
  const headers = Object.fromEntries(request.headers.entries());
  // The Fetch Request API omits Host in some runtimes (including local tests).
  // Use the validated request URL's authority for the original same-origin guard.
  if (!headers.host) headers.host = new URL(request.url).host;
  return headers;
}
async function makeRequest(request, url) {
  const req = {
    method: request.method.toUpperCase(),
    query: Object.fromEntries(url.searchParams.entries()),
    headers: headersObject(request),
    body: {},
    files: []
  };
  const mime = request.headers.get('content-type') || '';
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (mime.includes('application/json')) {
      try { req.body = await request.json(); }
      catch { throw Object.assign(new Error('Invalid JSON body.'), { status: 400 }); }
    } else if (mime.includes('multipart/form-data') || mime.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      for (const [field, value] of form.entries()) {
        if (typeof value === 'string') req.body[field] = value;
        else if (value && typeof value.arrayBuffer === 'function') {
          const arr = new Uint8Array(await value.arrayBuffer());
          req.files.push({ field, filename: value.name || 'upload.bin', contentType: value.type || '', buffer: arr });
        }
      }
    }
  }
  return req;
}
async function serveGalleryMedia(request, req, url) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const key = url.searchParams.get('key') || '';
  if (!/^academy\/gallery\/[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/.test(key))
    return new Response('Not found', { status: 404 });
  const row = await db.query('SELECT is_published FROM academy_gallery WHERE storage_key=$1 LIMIT 1', [key]);
  if (!row.rows.length) return new Response('Not found', { status: 404 });
  if (!row.rows[0].is_published) {
    const account = await getAccount(req);
    if (!account || !['admin', 'usthad'].includes(account.user.role))
      return new Response('Not found', { status: 404 });
  }
  const media = await storage.getStream(key);
  if (!media) return new Response('Not found', { status: 404 });
  const headers={'Content-Type':media.contentType,'Cache-Control':'private, no-store',
    'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
  const range=request.headers.get('range');
  if(range&&media.bytes){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!m)return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+media.length}});
    let start=m[1]?Number(m[1]):Math.max(0,media.length-Number(m[2])),end=m[2]&&m[1]?Number(m[2]):media.length-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=media.length||end<0)
      return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+media.length}});
    end=Math.min(end,media.length-1);
    return new Response(media.bytes.slice(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${media.length}`,'Content-Length':String(end-start+1)}});
  }
  return new Response(media.stream,{headers:{...headers,'Content-Length':String(media.length||0)}});
}
export default async function academyGateway(request) {
  const url = new URL(request.url);
  const route = String(url.searchParams.get('__route') || '').replace(/^\/+|\/+$/g, '');
  const handler = handlers[route];
  if (route !== 'api/academy/media' && route !== 'api/academy/gallery-chunks' && !handler)
    return Response.json({ error: 'Not found.' }, { status: 404 });
  if (!allowedMethods[route]?.includes(request.method.toUpperCase()))
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { 'Allow': (allowedMethods[route] || []).join(', ') } });
  const headers = { 'Cache-Control': 'no-store' };
  if (!(process.env.ACADEMY_STAGING_DATABASE_URL)) {
    return Response.json({ error: 'Isolated staging database has not yet been provisioned. No backend test has passed.' }, { status: 503, headers });
  }
  try {
    const req = await makeRequest(request, url);
    if (route === 'api/academy/media') return await serveGalleryMedia(request, req, url);
    if (route === 'api/academy/gallery-chunks') return await handleChunkUpload(request, req, url, makeResponse);
    // Hatchable's original bootstrap declared access="admin" at the platform level.
    // Without Hatchable's gate, require an owner-only setup secret until the Admin exists.
    if (route === 'api/identity/bootstrap' && req.method === 'POST') {
      const token = process.env.ACADEMY_STAGING_SETUP_TOKEN;
      if (!token || request.headers.get('x-academy-setup-token') !== token)
        return Response.json({ error: 'Owner-only staging setup.' }, { status: 403, headers });
    }
    const res = makeResponse();
    await handler(req, res);
    return res.finalize();
  } catch (error) {
    if (error.status === 400) return Response.json({ error: error.message }, { status: 400, headers });
    // Do not disclose database internals or credential strings to clients.
    console.error('Staging function failed', { route, code: error.code || 'UNEXPECTED' });
    return Response.json({ error: 'Staging operation failed.' }, { status: 500, headers });
  }
}