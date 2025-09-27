// worker/sequence-worker.js
// Hardened proxy for CSAT and visit signals. Validates payloads, enforces CORS
// and forwards to the configured downstream service using HTTPS only.
const JSON_LIMIT = 4096;

export default {
  async fetch(request, env) {
    const method = request.method?.toUpperCase?.() || 'GET';
    const url = new URL(request.url);
    const allowedOrigin = pickOrigin(env?.ALLOWED_ORIGIN);
    const forwardBase = sanitizeForwardBase(env?.FORWARDER_BASE);

    if (method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }), allowedOrigin);
    }

    if (!forwardBase) {
      return cors(json({ ok: false, error: 'missing_forward_base' }, 500), allowedOrigin);
    }

    try {
      if (method === 'GET' && url.pathname === '/') {
        return cors(json({
          ok: true,
          service: 'sequence-worker',
          routes: { csat: 'POST /csat', visit: 'POST /visit' },
          forwardBase
        }), allowedOrigin);
      }

      if (method === 'POST' && url.pathname === '/csat') {
        const body = await readJson(request, JSON_LIMIT);
        const rating = toRating(body?.rating);
        if (!rating) {
          return cors(json({ ok: false, error: 'invalid_rating' }, 400), allowedOrigin);
        }

        const payload = {
          v: 'v1',
          ts: new Date().toISOString(),
          rating,
          lang: toLang(body?.lang),
          uid: scrubId(body?.uid),
          fp: scrubId(body?.fp)
        };

        const ok = await forward(`${forwardBase}/csat`, payload);
        return cors(json({ ok }), allowedOrigin);
      }

      if (method === 'POST' && url.pathname === '/visit') {
        const body = await readJson(request, JSON_LIMIT);
        const payload = {
          v: 'v1',
          ts: new Date().toISOString(),
          lang: toLang(body?.lang),
          uid: scrubId(body?.uid),
          fp: scrubId(body?.fp),
          theme: toTheme(body?.theme)
        };

        const ok = await forward(`${forwardBase}/visit`, payload);
        return cors(json({ ok }), allowedOrigin);
      }

      return cors(json({ ok: false, error: 'not_found' }, 404), allowedOrigin);
    } catch (err) {
      return cors(json({ ok: false, error: normalizeError(err) }, 500), allowedOrigin);
    }
  }
};

/* ---------- helpers ---------- */
function pickOrigin(value) {
  if (typeof value !== 'string') return '*';
  try {
    const url = new URL(value.trim());
    return /^https?:$/i.test(url.protocol) ? url.origin : '*';
  } catch {
    return '*';
  }
}

function sanitizeForwardBase(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

async function readJson(request, limit) {
  const text = await request.text();
  if (text.length > limit) throw new Error('payload_too_large');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }
}

function toRating(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 1 && num <= 5 ? Math.floor(num) : 0;
}

function toLang(value) {
  return (typeof value === 'string' ? value : 'en').trim().slice(0, 5).toLowerCase() || 'en';
}

function toTheme(value) {
  return (typeof value === 'string' ? value : '').trim().slice(0, 16);
}

function scrubId(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/\p{C}/gu, '')
    .replace(/[^\w\-.@]/g, '')
    .trim()
    .slice(0, 64);
}

async function forward(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.ok;
  } catch {
    return false;
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function cors(resp, origin = '*') {
  const headers = new Headers(resp.headers);
  headers.set('access-control-allow-origin', origin || '*');
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  headers.set('access-control-max-age', '86400');
  return new Response(resp.body, { status: resp.status, headers });
}

function normalizeError(err) {
  if (!err) return 'unknown_error';
  if (typeof err === 'string') return err.slice(0, 128);
  if (err instanceof Error) return (err.message || 'error').slice(0, 128);
  return 'error';
}
