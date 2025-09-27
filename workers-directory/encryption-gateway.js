// workers-directory/encryption-gateway.js
// Hardened encryption/decryption service for edge workloads.  This worker uses
// AES-256-GCM with PBKDF2 key derivation and enforces token-based access
// control to satisfy NIST PR.AC and PCI DSS Requirement 7/8.

import {
  encryptString,
  decryptString,
} from "../encryption-directory/aes-gcm.js";

const MAX_BODY = 8192; // keep payloads small to reduce abuse surface

export default {
  async fetch(request, env) {
    const method = request.method?.toUpperCase?.() || "GET";
    const url = new URL(request.url);
    const origin = pickOrigin(env?.ALLOWED_ORIGIN);

    if (method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }), origin);
    }

    const masterSecret = sanitizeSecret(env?.MASTER_ENCRYPTION_SECRET);
    if (!masterSecret) {
      return cors(
        json({ ok: false, error: "misconfigured_secret" }, 500),
        origin,
      );
    }

    if (!isAuthorized(request, env)) {
      return cors(json({ ok: false, error: "unauthorized" }, 401), origin);
    }

    try {
      if (method === "GET" && url.pathname === "/") {
        return cors(
          json({
            ok: true,
            service: "encryption-gateway",
            capabilities: ["POST /encrypt", "POST /decrypt"],
            compliance: {
              encryption: "AES-256-GCM",
              keyDerivation: "PBKDF2-SHA256",
              policies: [
                "NIST CSF PR.DS",
                "CISA Cyber Essentials",
                "PCI DSS Req.3",
              ],
            },
          }),
          origin,
        );
      }

      if (method === "POST" && url.pathname === "/encrypt") {
        const body = await readJson(request, MAX_BODY);
        const plaintext = toSafeString(body?.plaintext);
        if (!plaintext) {
          return cors(
            json({ ok: false, error: "invalid_plaintext" }, 400),
            origin,
          );
        }

        const associatedData =
          typeof body?.aad === "string" ? body.aad.slice(0, 128) : undefined;
        const iterations = toIterations(body?.iterations);

        const result = await encryptString(masterSecret, plaintext, {
          associatedData,
          iterations,
        });

        return cors(json({ ok: true, ...result, iterations }), origin);
      }

      if (method === "POST" && url.pathname === "/decrypt") {
        const body = await readJson(request, MAX_BODY);
        const payload = normalizeDecryptBody(body);
        const plaintext = await decryptString(masterSecret, payload);
        return cors(json({ ok: true, plaintext }), origin);
      }

      return cors(json({ ok: false, error: "not_found" }, 404), origin);
    } catch (err) {
      return cors(json({ ok: false, error: normalizeError(err) }, 500), origin);
    }
  },
};

/* ---------- helpers ---------- */
function isAuthorized(request, env) {
  const token = env?.ENCRYPTION_GATEWAY_TOKEN;
  if (typeof token !== "string" || token.length < 16) return false;
  const header = request.headers.get("authorization") || "";
  const expected = `Bearer ${token}`;
  return timingSafeEqual(header, expected);
}

function sanitizeSecret(secret) {
  return typeof secret === "string" && secret.trim().length >= 32
    ? secret.trim()
    : "";
}

function toSafeString(v) {
  return typeof v === "string" ? v.normalize("NFKC").trim() : "";
}

function toIterations(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(10_000, Math.min(600_000, Math.floor(n)));
}

function normalizeDecryptBody(body) {
  if (!body || typeof body !== "object") {
    throw new Error("invalid_payload");
  }
  const ciphertext = toBase64String(body.ciphertext);
  const iv = toBase64String(body.iv);
  const salt = toBase64String(body.salt);
  const iterations = toIterations(body.iterations);
  const associatedData =
    typeof body.aad === "string" ? body.aad.slice(0, 128) : undefined;
  return { ciphertext, iv, salt, iterations, associatedData };
}

function toBase64String(v) {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error("invalid_base64_component");
  }
  return v.replace(/\s+/g, "");
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function cors(resp, origin = "*") {
  const headers = new Headers(resp.headers);
  headers.set("access-control-allow-origin", origin || "*");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "authorization,content-type");
  headers.set("access-control-max-age", "86400");
  return new Response(resp.body, { status: resp.status, headers });
}

function pickOrigin(value) {
  if (typeof value !== "string") return "*";
  try {
    const url = new URL(value.trim());
    return /^https?:$/i.test(url.protocol) ? url.origin : "*";
  } catch {
    return "*";
  }
}

function normalizeError(err) {
  if (!err) return "unknown_error";
  if (typeof err === "string") return err.slice(0, 128);
  if (err instanceof Error) return err.message.slice(0, 128) || "error";
  return "error";
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const viewA = new Uint8Array(encoder.encode(a));
  const viewB = new Uint8Array(encoder.encode(b));
  if (viewA.length !== viewB.length) return false;
  let diff = 0;
  for (let i = 0; i < viewA.length; i += 1) {
    diff |= viewA[i] ^ viewB[i];
  }
  return diff === 0;
}

const encoder = new TextEncoder();
