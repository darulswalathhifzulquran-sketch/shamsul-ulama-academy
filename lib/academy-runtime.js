// STAGING-ONLY adapter: replaces Hatchable's db and gallery storage APIs.
// No production data, credentials, API keys or Hatchable calls are used.
import pg from 'pg';
import { getConnectionString } from '@netlify/database';
import { getStore } from '@netlify/blobs';

const { Pool } = pg;
let pool;
function getPool() {
  if (pool) return pool;
  const url = process.env.NETLIFY_DB_URL || getConnectionString();
  if (!url) throw new Error('Netlify staging PostgreSQL database is not configured.');
  pool = new Pool({ connectionString: url, max: 4, idleTimeoutMillis: 15000, connectionTimeoutMillis: 10000 });
  return pool;
}

export const db = {
  async close() {
    if (pool) { const previous = pool; pool = null; await previous.end(); }
  },
  async query(sql, params = []) {
    const result = await getPool().query(sql, params);
    return { ...result, rows: result.rows || [], count: result.rowCount || 0, changes: result.rowCount || 0 };
  },
  async transaction(operations) {
    const client = await getPool().connect();
    const results = [];
    try {
      await client.query('BEGIN');
      for (const operation of operations) {
        results.push(await client.query(operation.sql, operation.params || []));
      }
      await client.query('COMMIT');
      return results;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }
};

const mediaStore = () => getStore('academy-gallery-staging');
function galleryUrl(key) {
  return '/api/academy/media?key=' + encodeURIComponent(key);
}
export const storage = {
  async put(key, data, contentType) {
    const content = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
    await mediaStore().set(key, content, { metadata: { contentType: String(contentType || 'application/octet-stream') } });
    return galleryUrl(key);
  },
  async url(key) {
    return galleryUrl(key);
  },
  async head(key) {
    const item = await mediaStore().getMetadata(key);
    return item ? { key, metadata: item.metadata, etag: item.etag } : null;
  },
  async del(key) {
    await mediaStore().delete(key);
  },
  async getStream(key) {
    const store = mediaStore();
    const meta = await store.getMetadata(key);
    if (!meta) return null;
    const stream = await store.get(key, { type: 'stream' });
    if (!stream) return null;
    return { stream, contentType: meta.metadata?.contentType || 'application/octet-stream' };
  }
};