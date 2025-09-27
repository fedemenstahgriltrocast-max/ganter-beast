import { encryptJSON, decryptJSON } from '../encryption-directory/aes-gcm.js';

const RATE_LIMIT = 60; // max requests per token per minute

const memoryStore = new Map();

function rateLimit(token) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const history = memoryStore.get(token)?.filter((stamp) => stamp >= windowStart) ?? [];
  if (history.length >= RATE_LIMIT) {
    throw Object.assign(new Error('Rate limit exceeded'), { status: 429 });
  }
  history.push(now);
  memoryStore.set(token, history);
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function requireTLS(request) {
  if (request.headers.get('CF-Visitor')?.includes('https')) return;
  if (request.url.startsWith('https://')) return;
  throw Object.assign(new Error('HTTPS required'), { status: 400 });
}

function authenticate(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || token !== env.GATEWAY_TOKEN) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return token;
}

async function handleEncrypt(request, env) {
  const payload = await request.json().catch(() => {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  });
  return encryptJSON({
    passphrase: env.ENCRYPTION_SECRET,
    data: payload,
  });
}

async function handleDecrypt(request, env) {
  const payload = await request.json().catch(() => {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  });
  return decryptJSON({
    passphrase: env.ENCRYPTION_SECRET,
    payload,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || 'https://marxia.example',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '600',
        },
      });
    }

    if (request.method !== 'POST') {
      return response({ error: 'Method not allowed' }, 405);
    }

    try {
      requireTLS(request);
      const token = authenticate(request, env);
      rateLimit(token);

      const url = new URL(request.url);
      let result;
      switch (url.pathname) {
        case '/encrypt':
          result = await handleEncrypt(request, env);
          break;
        case '/decrypt':
          result = await handleDecrypt(request, env);
          break;
        default:
          return response({ error: 'Not found' }, 404);
      }

      return response(result);
    } catch (error) {
      const status = error.status || 500;
      return response({ error: error.message || 'Unhandled error' }, status);
    }
  },
};
