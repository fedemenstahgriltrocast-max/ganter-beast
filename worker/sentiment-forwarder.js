const MALICIOUS_PATTERNS = [
  /<\/?\s*script/i,
  /<\/?\s*iframe/i,
  /<\/?\s*object/i,
  /javascript:/i,
  /data:text\/html/i,
  /on\w+=/i
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method?.toUpperCase?.() || 'GET';

    const allowedOrigin = selectAllowedOrigin(env?.ALLOWED_ORIGIN);

    if (method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }), allowedOrigin);
    }

    const appsBase = ensureHttps(env?.APPS_FORWARD_URL);
    if (!appsBase) {
      return cors(json({ ok: false, error: 'missing_destination' }, 500), allowedOrigin);
    }

    try {
      if (method === 'GET' && url.pathname === '/') {
        return cors(json({
          ok: true,
          service: 'sentiment-sanitizer',
          routes: {
            csat: '/csat',
            visit: '/visit'
          },
          forwardBase: appsBase
        }), allowedOrigin);
      }

      if (method === 'POST' && url.pathname === '/csat') {
        const body = await readJson(request);
        const sanitized = sanitizePayload(body, {
          allowUid: true,
          allowTheme: false
        });

        if (sanitized.malicious) {
          return cors(json({ ok: false, error: 'malicious_content_detected' }, 400), allowedOrigin);
        }

        const rating = sanitizeRating(body?.rating);
        if (!rating) {
          return cors(json({ ok: false, error: 'invalid_rating' }, 400), allowedOrigin);
        }

        const payload = {
          rating,
          uid: sanitized.uid || crypto.randomUUID(),
          fp: sanitized.fp || '',
          lang: sanitized.lang || 'en',
          ts: new Date().toISOString()
        };

        const ok = await forward(buildForwardUrl(appsBase, 'csat'), payload);
        return cors(json({ ok }), allowedOrigin);
      }

      if (method === 'POST' && url.pathname === '/visit') {
        const body = await readJson(request);
        const sanitized = sanitizePayload(body, {
          allowUid: true,
          allowTheme: true
        });

        if (sanitized.malicious) {
          return cors(json({ ok: false, error: 'malicious_content_detected' }, 400), allowedOrigin);
        }

        const payload = {
          uid: sanitized.uid || crypto.randomUUID(),
          fp: sanitized.fp || '',
          lang: sanitized.lang || 'en',
          theme: sanitized.theme || '',
          ts: new Date().toISOString()
        };

        const ok = await forward(buildForwardUrl(appsBase, 'vis'), payload);
        return cors(json({ ok }), allowedOrigin);
      }

      return cors(json({ ok: false, error: 'not_found' }, 404), allowedOrigin);
    } catch (error) {
      return cors(json({ ok: false, error: String(error?.message || error) }, 500), allowedOrigin);
    }
  }
};

function selectAllowedOrigin(value) {
  if (typeof value !== 'string') return '*';
  const trimmed = value.trim();
  if (!trimmed || trimmed === '*') {
    return '*';
  }
  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return '*';
    }
    return parsed.origin;
  } catch {
    return '*';
  }
}

function ensureHttps(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      return '';
    }
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '/');
  } catch {
    return '';
  }
}

function buildForwardUrl(base, app) {
  if (!base) return '';
  try {
    const target = new URL(base);
    target.searchParams.set('app', app);
    return target.toString();
  } catch {
    return '';
  }
}

async function readJson(request, limit = 4096) {
  const text = await request.text();
  if (text.length > limit) {
    throw new Error('payload_too_large');
  }
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }
}

function sanitizePayload(source, options = {}) {
  const result = {};
  let malicious = false;
  const maxIdLength = 64;
  const maxLangLength = 12;
  const maxThemeLength = 16;

  const uid = options.allowUid ? safeId(source?.uid || '', maxIdLength) : '';
  const fp = safeId(source?.fp || '', maxIdLength);
  const lang = sanitizeString(source?.lang || '', maxLangLength);
  const theme = options.allowTheme ? sanitizeString(source?.theme || '', maxThemeLength) : '';

  const inspector = value => {
    if (typeof value === 'string') {
      if (containsMalicious(value)) {
        malicious = true;
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(inspector);
      return;
    }
    if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) {
        inspector(nested);
      }
    }
  };

  inspector(source);

  result.uid = uid;
  result.fp = fp;
  result.lang = lang || 'en';
  if (options.allowTheme) {
    result.theme = theme;
  }
  result.malicious = malicious;
  return result;
}

function containsMalicious(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.normalize('NFKC');
  return MALICIOUS_PATTERNS.some(pattern => pattern.test(normalized));
}

function sanitizeString(value, max = 256) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/\p{C}/gu, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);
}

function safeId(value, max = 64) {
  return sanitizeString(value, max).replace(/[^\w\-.@]/g, '');
}

function sanitizeRating(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  if (number < 1 || number > 5) return 0;
  return Math.floor(number);
}

async function forward(url, payload) {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
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

function cors(response, origin = '*') {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin || '*');
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  headers.set('access-control-max-age', '86400');
  return new Response(response.body, { status: response.status, headers });
}
