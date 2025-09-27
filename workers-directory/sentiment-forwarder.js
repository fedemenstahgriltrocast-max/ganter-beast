// workers-directory/sentiment-forwarder.js
const MAX_JSON = 4096;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method?.toUpperCase?.() || "GET";
    const allowedOrigin = pickOrigin(env?.ALLOWED_ORIGIN);
    const base = normalizeBase(env?.APPS_FORWARD_URL); // e.g. https://weathered-disk-a104.distraction.workers.dev/

    if (method === "OPTIONS")
      return cors(new Response(null, { status: 204 }), allowedOrigin);
    if (!base)
      return cors(
        json({ ok: false, error: "missing_destination" }, 500),
        allowedOrigin,
      );

    try {
      if (method === "GET" && url.pathname === "/") {
        return cors(
          json({
            ok: true,
            service: "sentiment-forwarder (simple)",
            routes: { csat: "POST /csat", visit: "POST /visit" },
            forwardBase: base,
          }),
          allowedOrigin,
        );
      }

      // --- CSAT: rating 1..5 + minimal context ---
      if (method === "POST" && url.pathname === "/csat") {
        const body = await readJson(request, MAX_JSON); // { rating, lang, uid?, fp? }
        const rating = toRating(body?.rating);
        if (!rating)
          return cors(
            json({ ok: false, error: "invalid_rating" }, 400),
            allowedOrigin,
          );

        const payload = {
          v: "v1",
          ts: new Date().toISOString(),
          rating,
          lang: toLang(body?.lang),
          uid: scrubId(body?.uid),
          fp: scrubId(body?.fp),
        };

        const ok = await forward(`${base}?app=csat`, payload);
        return cors(json({ ok }), allowedOrigin);
      }

      // --- Visitors (optional ping) ---
      if (method === "POST" && url.pathname === "/visit") {
        const body = await readJson(request, MAX_JSON); // { lang, uid?, fp?, theme? }
        const payload = {
          v: "v1",
          ts: new Date().toISOString(),
          lang: toLang(body?.lang),
          uid: scrubId(body?.uid),
          fp: scrubId(body?.fp),
          theme: toTheme(body?.theme),
        };

        const ok = await forward(`${base}?app=vis`, payload);
        return cors(json({ ok }), allowedOrigin);
      }

      return cors(json({ ok: false, error: "not_found" }, 404), allowedOrigin);
    } catch (err) {
      return cors(
        json({ ok: false, error: String(err?.message || err) }, 500),
        allowedOrigin,
      );
    }
  },
};

/* ---------- helpers ---------- */
function pickOrigin(v) {
  if (typeof v !== "string") return "*";
  try {
    const u = new URL(v.trim());
    return /^https?:$/i.test(u.protocol) ? u.origin : "*";
  } catch {
    return "*";
  }
}
function normalizeBase(v) {
  if (typeof v !== "string" || !v) return "";
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return "";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/+$/, "/");
  } catch {
    return "";
  }
}
async function readJson(request, limit) {
  const text = await request.text();
  if (text.length > limit) throw new Error("payload_too_large");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_json");
  }
}
function toRating(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.floor(n) : 0;
}
function toLang(x) {
  return (
    (typeof x === "string" ? x : "en").trim().slice(0, 5).toLowerCase() || "en"
  );
}
function toTheme(x) {
  return (typeof x === "string" ? x : "").trim().slice(0, 16);
}
function scrubId(x) {
  if (typeof x !== "string") return "";
  return x
    .normalize("NFKC")
    .replace(/\p{C}/gu, "")
    .replace(/[^\w\-.@]/g, "")
    .trim()
    .slice(0, 64);
}
async function forward(url, body) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch {
    return false;
  }
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
function cors(resp, origin = "*") {
  const h = new Headers(resp.headers);
  h.set("access-control-allow-origin", origin || "*");
  h.set("access-control-allow-methods", "GET,POST,OPTIONS");
  h.set("access-control-allow-headers", "content-type");
  h.set("access-control-max-age", "86400");
  return new Response(resp.body, { status: resp.status, headers: h });
}
