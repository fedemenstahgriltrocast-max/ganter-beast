// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') return new Response(null, { status: 204 });

    const forwardURL = 'https://your-sentiment-forwarder.workers.dev';

    // --- CSAT ---
    if (method === 'POST' && url.pathname === '/csat') {
      const body = await request.json().catch(() => ({}));
      const payload = {
        v: 'v1',
        ts: new Date().toISOString(),
        rating: Number(body.rating) || 0,
        lang: (body.lang || 'en').trim(),
        uid: (body.uid || '').trim(),
        fp:  (body.fp  || '').trim()
      };
      const ok = await fetch(`${forwardURL}/csat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return new Response(JSON.stringify({ ok: ok.ok }), { headers: { 'content-type': 'application/json' } });
    }

    // --- VISIT ---
    if (method === 'POST' && url.pathname === '/visit') {
      const body = await request.json().catch(() => ({}));
      const payload = {
        v: 'v1',
        ts: new Date().toISOString(),
        lang: (body.lang || 'en').trim(),
        uid: (body.uid || '').trim(),
        fp:  (body.fp  || '').trim(),
        theme: (body.theme || '').trim()
      };
      const ok = await fetch(`${forwardURL}/visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return new Response(JSON.stringify({ ok: ok.ok }), { headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'not_found' }), {
      status: 404, headers: { 'content-type': 'application/json' }
    });
  }
};
