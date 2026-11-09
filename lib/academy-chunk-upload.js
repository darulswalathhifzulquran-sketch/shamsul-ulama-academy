// STAGING ONLY: chunked 16 MiB gallery uploads through Netlify Functions (< 4.5 MiB per request).
// Preserves Gallery authorization and original final validation by calling the real gallery handler.
import { getStore } from '@netlify/blobs';
import { getAccount, checkCsrf } from './academy-auth.js';
import galleryHandler from '../api/academy/gallery.js';

const CHUNK_BYTES = 2 * 1024 * 1024;
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_AGE_MS = 20 * 60 * 1000;
const tmpStore = () => getStore('academy-gallery-staging-chunks');
const metaKey = id => 'pending/' + id + '/manifest';
const pieceKey = (id, index) => 'pending/' + id + '/piece-' + index;
const reply = (code, obj) => Response.json(obj, { status: code, headers: { 'Cache-Control': 'no-store' } });

async function sessionFor(req) {
  const s = await getAccount(req);
  if (!s) return { error: reply(401, { error: 'Sign in required.' }) };
  if (!['admin', 'usthad'].includes(s.user.role))
    return { error: reply(403, { error: 'Not authorised.' }) };
  if (!await checkCsrf(req, s))
    return { error: reply(403, { error: 'Request verification failed.' }) };
  return { s };
}

async function readSession(id, accountId) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const m = await tmpStore().get(metaKey(id), { type: 'json' });
  if (!m || Number(m.accountId) !== Number(accountId) ||
      Date.now() - Number(m.createdAt) > MAX_AGE_MS) return null;
  return m;
}

export async function handleChunkUpload(request, req, url, makeResponse) {
  const { s, error } = await sessionFor(req);
  if (error) return error;
  const store = tmpStore();

  if (req.method === 'POST' && req.body?.action === 'start') {
    const fileSize = Number(req.body?.size);
    const mime = String(req.body?.mime || '');
    const name = String(req.body?.filename || '').slice(0, 200);
    if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_BYTES)
      return reply(400, { error: 'Files must be 1 byte to 16 MiB.' });
    if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(mime))
      return reply(415, { error: 'Only JPEG, PNG, WebP, MP4 and WebM supported.' });
    if (!name || req.body?.rights_confirmed !== true)
      return reply(400, { error: 'Select a file and confirm media publishing rights.' });
    const id = crypto.randomUUID();
    const form = {
      caption: String(req.body?.caption || '').slice(0, 251),
      alt_text: String(req.body?.alt_text || '').slice(0, 251),
      display_order: String(req.body?.display_order || '0'),
      rights_confirmed: 'true',
      is_published: req.body?.is_published === 'true' ? 'true' : 'false',
      video_url: ''
    };
    const metadata = {
      accountId: Number(s.user.id), createdAt: Date.now(),
      size: fileSize, chunks: Math.ceil(fileSize / CHUNK_BYTES), mime, filename: name, form
    };
    await store.setJSON(metaKey(id), metadata);
    return reply(201, { ok: true, upload_id: id, chunk_size: CHUNK_BYTES, chunks: metadata.chunks });
  }

  const id = String(req.method === 'PUT' ? url.searchParams.get('upload_id') : req.body?.upload_id || '');
  const meta = await readSession(id, s.user.id);
  if (!meta) return reply(404, { error: 'Upload session not found or expired.' });

  if (req.method === 'PUT') {
    const index = Number(url.searchParams.get('index'));
    if (!Number.isSafeInteger(index) || index < 0 || index >= meta.chunks)
      return reply(400, { error: 'Invalid chunk index.' });
    const bytes = new Uint8Array(await request.arrayBuffer());
    const expected = Math.min(CHUNK_BYTES, meta.size - index * CHUNK_BYTES);
    if (bytes.length !== expected)
      return reply(400, { error: 'File chunk size mismatch.' });
    await store.set(pieceKey(id, index), bytes.buffer);
    return reply(200, { ok: true, index, received: bytes.length });
  }

  if (req.method === 'POST' && req.body?.action === 'finish') {
    const arrays = [];
    let total = 0;
    for (let i = 0; i < meta.chunks; i++) {
      const data = await store.get(pieceKey(id, i), { type: 'arrayBuffer' });
      if (!data) return reply(409, { error: 'One or more upload chunks are missing.' });
      const part = new Uint8Array(data);
      const expected = Math.min(CHUNK_BYTES, meta.size - i * CHUNK_BYTES);
      if (part.length !== expected) return reply(409, { error: 'Uploaded media is incomplete.' });
      arrays.push(part);
      total += part.length;
    }
    if (total !== meta.size) return reply(409, { error: 'Uploaded media length mismatch.' });
    const combined = new Uint8Array(total);
    let cursor = 0;
    for (const part of arrays) { combined.set(part, cursor); cursor += part.length; }
    // Critically: reuse the ORIGINAL Gallery backend for content sniffing, role/CSRF
    // checks, persistent object creation, SQL record save and audit logging.
    const virtualReq = {
      ...req, method: 'POST', body: meta.form,
      files: [{ field: 'file', filename: meta.filename, contentType: meta.mime, buffer: combined }]
    };
    const originalResponse = makeResponse();
    await galleryHandler(virtualReq, originalResponse);
    const result = originalResponse.finalize();
    if (result.status >= 200 && result.status < 300) {
      try {
        for (let i = 0; i < meta.chunks; i++) await store.delete(pieceKey(id, i));
        await store.delete(metaKey(id));
      } catch (cleanupError) { console.warn('Gallery upload succeeded; staging chunk cleanup should be retried.'); }
    }
    return result;
  }

  if (req.method === 'POST' && req.body?.action === 'cancel') {
    for (let i = 0; i < meta.chunks; i++) await store.delete(pieceKey(id, i));
    await store.delete(metaKey(id));
    return reply(200, { ok: true, cancelled: true });
  }
  return reply(400, { error: 'Unknown media upload action.' });
}
