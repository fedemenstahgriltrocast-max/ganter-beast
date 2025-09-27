import { encryptJSON } from '../encryption-directory/aes-gcm.js';

function parseOrigins(env) {
  if (!env.ALLOWED_ORIGINS) return [];
  return env.ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function ensureOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null; // non-browser requests
  const allowlist = parseOrigins(env);
  if (allowlist.length > 0 && !allowlist.includes(origin)) {
    throw Object.assign(new Error('Origin not allowed'), { status: 403 });
  }
  return origin;
}

async function readJSON(request) {
  const text = await request.text();
  if (!text) throw Object.assign(new Error('Empty request body'), { status: 422 });

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw Object.assign(new Error('Malformed JSON payload'), { status: 400 });
  }

  const { orderId, customer, items } = data;
  if (!orderId || typeof orderId !== 'string' || orderId.length < 8) {
    throw Object.assign(new Error('Invalid orderId'), { status: 422 });
  }
  if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw Object.assign(new Error('Invalid customer.email'), { status: 422 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('Order items required'), { status: 422 });
  }

  return { orderId, customer, items };
}

async function forwardToAPI(env, payload) {
  const target = new URL('/api/v1/orders', env.FORWARDER_BASE);
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw Object.assign(new Error('Upstream API error'), { status: response.status });
  }

  return response;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      try {
        const origin = ensureOrigin(request, env);
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
            'Access-Control-Max-Age': '86400',
          },
          status: 204,
        });
      } catch (error) {
        const status = error.status || 403;
        return jsonResponse({ error: error.message }, { status });
      }
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
      const origin = ensureOrigin(request, env);
      const idempotencyKey = request.headers.get('Idempotency-Key');
      if (!idempotencyKey) {
        throw Object.assign(new Error('Missing Idempotency-Key header'), { status: 428 });
      }

      const payload = await readJSON(request);

      const encrypted = await encryptJSON({
        passphrase: env.ENCRYPTION_SECRET,
        data: { ...payload, receivedAt: new Date().toISOString() },
      });

      ctx.waitUntil(
        forwardToAPI(env, {
          origin,
          idempotencyKey,
          encrypted,
        })
      );

      return jsonResponse({ status: 'queued' });
    } catch (error) {
      const status = error.status || 500;
      return jsonResponse({ error: error.message || 'Unhandled error' }, { status });
    }
  },
};
