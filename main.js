const workerTomlUrl = new URL("worker.toml", window.location.href).href;

function stripInlineComment(line) {
  let quote = null;
  let escaped = false;
  let result = "";
  for (const char of line) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      result += char;
      continue;
    }
    if (char === '"' || char === "'") {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
      result += char;
      continue;
    }
    if (char === "#" && !quote) {
      break;
    }
    result += char;
  }
  return result.trim();
}

function assignPath(target, path, key, value) {
  let scope = target;
  for (const segment of path) {
    if (!segment) continue;
    if (typeof scope[segment] !== "object" || scope[segment] === null) {
      scope[segment] = {};
    }
    scope = scope[segment];
  }
  scope[key] = value;
}

function parseTomlValue(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true" || value === "false") {
    return value === "true";
  }
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num;
  }
  return value;
}

function parseWorkerToml(text) {
  const config = {};
  const sectionPath = [];
  const lines = text.split(/\r?\n/);
  for (let rawLine of lines) {
    let line = stripInlineComment(rawLine);
    if (!line) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      sectionPath.length = 0;
      const inner = line.slice(1, -1).trim();
      if (inner) {
        for (const part of inner.split(".")) {
          if (part) sectionPath.push(part);
        }
      }
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = parseTomlValue(line.slice(equalsIndex + 1));
    if (key) assignPath(config, sectionPath, key, value);
  }
  return config;
}

window.workerConfigPromise = (async () => {
  try {
    const response = await fetch(workerTomlUrl, {
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok) {
      throw new Error(`worker.toml load failed: ${response.status}`);
    }
    const text = await response.text();
    return parseWorkerToml(text);
  } catch (error) {
    console.warn("Unable to load worker configuration", error);
    return {};
  }
})();

window.workerConfigPromise.then((config) => {
  if (config && typeof config === "object") {
    window.workerConfig = config;
  }
});

/* === CONSTANTS (point to your Worker and its public enc key) === */
const workerSettings = await window.workerConfigPromise;
const ENDPOINT = normalizeEndpoint(
  workerSettings?.vars?.PUBLIC_SENTIMENT_BASE ||
    workerSettings?.vars?.PUBLIC_WORKER_BASE ||
    workerSettings?.vars?.APPS_FORWARD_URL ||
    "",
);

const DEFAULT_BUSINESS = Object.freeze({
  name: "Marxia Café y Bocaditos",
  address: "Av. Principal y Calle A",
  city: "Guayaquil",
  contact: "+593 99 999 9999",
  logo_url: "",
});

const getAppBindings = () => window.__appBindings || {};
const callBinding = (fn, fallback) => {
  try {
    return typeof fn === "function" ? fn() : fallback;
  } catch (err) {
    console.warn("app binding invocation failed", err);
    return fallback;
  }
};

function normalizeEndpoint(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.origin + (url.pathname || "");
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}
const ENC_P256_KID = "a973cb4c-c7ab-4e2f-8f54-0b40cbc24062";
const ENC_P256_PUB_JWK = {
  crv: "P-256",
  ext: true,
  key_ops: [],
  kty: "EC",
  x: "FdOtddmDnfbEmTgEJ51mBui-WDug6pW7UGAalHYfM0I",
  y: "ziKmEaTpbLhuukXQTjs9f3EiPS5QaJbcR1Zg-XDLFiM",
};

/* === helpers === */
const sanitizeText = (value) => {
  if (typeof value !== "string") return "";
  return value.normalize("NFKC").replace(/\p{C}/gu, "").trim();
};
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
const encInfo = new TextEncoder().encode("enc.v1/ekey");
const b64u = (bytes) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* === build sealed envelope for the Worker === */
async function sealForWorker(payload) {
  // ephemeral P-256 for this transaction
  const eph = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const epkJwk = await crypto.subtle.exportKey("jwk", eph.publicKey);

  // import worker public key
  const serverPub = await crypto.subtle.importKey(
    "jwk",
    ENC_P256_PUB_JWK,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPub },
    eph.privateKey,
    256,
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hkdfBase = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(shared),
    "HKDF",
    false,
    ["deriveKey"],
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: encInfo },
    hkdfBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(JSON.stringify(payload));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, pt);

  // tamper-evident hashes
  const asset_id = await sha256Hex(
    JSON.stringify({
      policy: payload.policy,
      items: payload.cart.items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        unit: i.unit,
      })),
      total: payload.cart.total,
    }),
  );
  const asset_auth = await sha256Hex(JSON.stringify(payload));

  return {
    kid: ENC_P256_KID,
    epk: {
      kty: "EC",
      crv: "P-256",
      x: epkJwk.x,
      y: epkJwk.y,
      ext: true,
      key_ops: [],
    },
    iv: b64u(iv),
    salt: b64u(salt),
    ciphertext: b64u(new Uint8Array(ct)),
    asset_id,
    asset_auth,
  };
}

async function postEnvelope(envelope) {
  const res = await fetch(`${ENDPOINT}/init`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(envelope),
  });
  return res.json();
}

/**
 * Build an encrypted envelope for the Worker using an order payload that
 * mirrors the checkout data collected in the main application flow.
 * The function returns the Worker response (usually { ok, token }).
 */
async function initializeWorkerTransaction(orderPayload, options = {}) {
  if (!ENDPOINT) {
    return { ok: false, skipped: true, reason: "missing_endpoint" };
  }
  if (!orderPayload || typeof orderPayload !== "object") {
    throw new TypeError("orderPayload must be an object");
  }
  const context =
    options &&
    typeof options === "object" &&
    options.context &&
    typeof options.context === "object"
      ? options.context
      : {};
  const bindings = getAppBindings();
  const policy =
    typeof options.policy === "string" && options.policy.trim()
      ? options.policy.trim()
      : "OPS";
  const resolvedLang =
    sanitizeText(
      orderPayload.lang ||
        context.lang ||
        callBinding(bindings.getLang, "") ||
        "es",
    ) || "es";
  const resolvedBusiness =
    orderPayload.business ||
    context.business ||
    callBinding(bindings.getBusiness, DEFAULT_BUSINESS) ||
    DEFAULT_BUSINESS;
  const sanitizedBusiness =
    !resolvedBusiness || typeof resolvedBusiness !== "object"
      ? DEFAULT_BUSINESS
      : {
          name: sanitizeText(resolvedBusiness.name) || DEFAULT_BUSINESS.name,
          address:
            sanitizeText(resolvedBusiness.address) || DEFAULT_BUSINESS.address,
          city: sanitizeText(resolvedBusiness.city) || DEFAULT_BUSINESS.city,
          contact:
            sanitizeText(resolvedBusiness.contact) || DEFAULT_BUSINESS.contact,
          logo_url: sanitizeText(
            resolvedBusiness.logo_url ||
              resolvedBusiness.logoURL ||
              DEFAULT_BUSINESS.logo_url,
          ),
        };

  const deliverySource = orderPayload.delivery || {};
  const effectiveDeliveryMinutes =
    Number(
      deliverySource.minutes ??
        context.deliveryMinutes ??
        callBinding(bindings.getDeliveryMinutes, 0),
    ) || 0;
  const deliveryFormatter =
    typeof context.formatDeliveryTime === "function"
      ? context.formatDeliveryTime
      : typeof bindings.formatDeliveryTime === "function"
        ? bindings.formatDeliveryTime
        : null;
  const deliveryDisplay = sanitizeText(
    deliverySource.display ||
      context.deliveryDisplay ||
      (deliveryFormatter ? deliveryFormatter(effectiveDeliveryMinutes) : ""),
  );
  const cartItems = Array.isArray(orderPayload?.cart?.items)
    ? orderPayload.cart.items.filter((item) => item && Number(item.qty) > 0)
    : [];
  if (!cartItems.length) {
    return { ok: false, skipped: true, reason: "empty_cart" };
  }
  const sanitizedItems = cartItems.map((item) => ({
    id: item.id,
    name: sanitizeText(item.name || ""),
    desc: sanitizeText(item.desc || ""),
    qty: Number(item.qty) || 0,
    unit: toNumber(item.unit),
  }));
  const delivery = orderPayload.delivery || {};
  const customer = orderPayload.customer || {};
  const preparedPayload = {
    policy,
    lang: resolvedLang,
    timestamp: orderPayload.timestamp || new Date().toISOString(),
    business: sanitizedBusiness,
    customer: {
      firstName: sanitizeText(customer.firstName),
      lastName: sanitizeText(customer.lastName),
      idNumber: sanitizeText(customer.idNumber),
      phone: sanitizeText(customer.phone),
      email: sanitizeText(customer.email),
      address: sanitizeText(customer.address),
      city: sanitizeText(customer.city),
      locationConfirmed: Boolean(customer.locationConfirmed),
    },
    delivery: {
      minutes: Number(delivery.minutes ?? effectiveDeliveryMinutes) || 0,
      fee: toNumber(delivery.fee),
      included: delivery.included !== false,
      display: deliveryDisplay,
    },
    cart: {
      items: sanitizedItems,
      subtotal: toNumber(orderPayload?.cart?.subtotal),
      vat: toNumber(orderPayload?.cart?.vat),
      delivery: toNumber(orderPayload?.cart?.delivery),
      total: toNumber(orderPayload?.cart?.total),
      instructions: sanitizeText(orderPayload?.cart?.instructions),
    },
  };
  if (
    customer &&
    typeof customer.mapLinks === "object" &&
    customer.mapLinks !== null
  ) {
    preparedPayload.customer.mapLinks = customer.mapLinks;
  }
  const gpsSource =
    customer && typeof customer.gps === "object" && customer.gps
      ? customer.gps
      : context && typeof context.gps === "object" && context.gps
        ? context.gps
        : callBinding(bindings.getGps, null);
  if (
    gpsSource &&
    typeof gpsSource.lat === "number" &&
    typeof gpsSource.lng === "number"
  ) {
    preparedPayload.customer.gps = {
      lat: Number(gpsSource.lat),
      lng: Number(gpsSource.lng),
      confirmedAt: gpsSource.confirmedAt || null,
    };
  }
  try {
    const envelope = await sealForWorker(preparedPayload);
    const response = await postEnvelope(envelope);
    if (response && typeof response === "object") {
      return response;
    }
    return { ok: true };
  } catch (err) {
    console.error("Worker transaction initialization failed", err);
    throw err;
  }
}

window.initializeWorkerTransaction = initializeWorkerTransaction;

/* CONFIG */
const workerConfig = await window.workerConfigPromise;
const CLOUDFLARE_WORKER_URL = selectWorkerUrl(
  workerConfig,
  "PUBLIC_WORKER_BASE",
);
const WORKER_CSAT_URL =
  selectWorkerUrl(workerConfig, "PUBLIC_CSAT_URL") || CLOUDFLARE_WORKER_URL;

function selectWorkerUrl(config, primaryKey) {
  const fallbackKeys = [
    "PUBLIC_SENTIMENT_BASE",
    "APPS_FORWARD_URL",
    "FORWARDER_BASE",
  ];
  const keys = [primaryKey, ...fallbackKeys];
  for (const key of keys) {
    if (!key) continue;
    const value = config?.vars?.[key];
    if (typeof value === "string" && value.trim()) {
      const normalized = sanitizeBaseUrl(value);
      if (normalized) return normalized;
    }
  }
  return "";
}

function sanitizeBaseUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (!/^https?:$/i.test(url.protocol)) return "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/+$/, "/");
  } catch {
    return trimmed.replace(/\s+/g, "");
  }
}

const joinWorkerPath = (base, segment = "") => {
  if (!base) return "";
  const trimmedBase = String(base).trim();
  const trimmedSegment = String(segment || "").trim();
  try {
    const url = new URL(trimmedBase);
    const basePath = url.pathname.replace(/\/+$/, "");
    const normalizedBase = basePath.replace(/^\/+/, "").replace(/\/+$/, "");
    const normalizedSegment = trimmedSegment
      ? trimmedSegment.replace(/^\/+/, "").replace(/\/+$/, "")
      : "";
    const pathParts = [];
    if (normalizedBase) pathParts.push(normalizedBase);
    if (normalizedSegment) pathParts.push(normalizedSegment);
    url.pathname = pathParts.length ? `/${pathParts.join("/")}` : "/";
    url.search = "";
    url.hash = "";
    const href = url.href;
    if (pathParts.length === 0) return url.origin;
    return href.endsWith("/") ? href.slice(0, -1) : href;
  } catch {
    const baseNoSlash = trimmedBase.replace(/\/+$/, "");
    if (!trimmedSegment) return baseNoSlash;
    const segmentNoSlash = trimmedSegment.replace(/^\/+/, "");
    return segmentNoSlash ? `${baseNoSlash}/${segmentNoSlash}` : baseNoSlash;
  }
};

const normalizeUrlCandidate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    if (!url.search) return url.href.replace(/\/+$/, "");
    return url.href;
  } catch {
    return raw;
  }
};

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyJ8ZBUrTnS4xsGQbXT2J7m7-dKFOTHITq6MgposYzanjYWeti-dXlpr6_0YLN8mfYevQ/exec";

const WORKER_CSAT_BASE = joinWorkerPath(WORKER_CSAT_URL, "");
const MAX_PENDING = 25;
let pending = [];
const CSAT_SUBMIT_ENDPOINT = joinWorkerPath(WORKER_CSAT_BASE, "csat");
const CSAT_VISIT_ENDPOINT = joinWorkerPath(WORKER_CSAT_BASE, "visit");
const CSAT_STATS_ENDPOINTS = (() => {
  const set = new Set();
  const add = (url) => {
    const normalized = normalizeUrlCandidate(url);
    if (normalized) set.add(normalized);
  };
  add(joinWorkerPath(WORKER_CSAT_BASE, "csat"));
  add(joinWorkerPath(WORKER_CSAT_BASE, "stats"));
  if (WORKER_CSAT_URL) {
    try {
      const parsed = new URL(WORKER_CSAT_URL);
      add(`${parsed.origin}/csat`);
      add(`${parsed.origin}/stats`);
    } catch {}
  }
  if (APPS_SCRIPT_URL) {
    const trimmed = String(APPS_SCRIPT_URL).trim();
    if (trimmed) {
      try {
        const statsUrl = new URL(trimmed);
        statsUrl.searchParams.set("app", "csat");
        statsUrl.searchParams.set("stats", "1");
        add(statsUrl.toString());
      } catch {
        const base = trimmed.replace(/\/+$/, "");
        add(`${base}?app=csat&stats=1`);
      }
    }
  }
  return Array.from(set);
})();

const WORKER_CSAT_ENDPOINTS = (() => {
  const endpoints = new Set();
  const add = (url) => {
    const normalized = normalizeUrlCandidate(url);
    if (normalized) endpoints.add(normalized);
  };
  add(CSAT_SUBMIT_ENDPOINT);
  add(WORKER_CSAT_BASE);
  if (WORKER_CSAT_URL) {
    try {
      const parsed = new URL(WORKER_CSAT_URL);
      add(`${parsed.origin}/csat`);
      add(parsed.origin);
    } catch {}
  }
  return Array.from(endpoints);
})();
const deriveCsatPostUrl = (endpoint) => {
  if (!endpoint) return "";
  let normalized = String(endpoint).trim();
  if (!normalized) return "";
  normalized = normalized.replace(/\s+/g, "");
  if (/\/csat\/?$/i.test(normalized)) {
    return normalized.replace(/\/+$/, "");
  }
  try {
    const url = new URL(normalized);
    const base =
      `${url.origin}${url.pathname.replace(/\/+$/, "")}` || url.origin;
    return `${base.replace(/\/+$/, "")}/csat`;
  } catch {
    return `${normalized.replace(/\/+$/, "")}/csat`;
  }
};
window.CLOUDFLARE_WORKER_URL = CLOUDFLARE_WORKER_URL;
window.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
window.CLOUDFLARE_ENC_P256_PUB_JWK = Object.freeze({
  crv: "P-256",
  ext: true,
  key_ops: [],
  kty: "EC",
  x: "uBnUp3ouNZbH8Cq6DMGi1pHJUBCXsNz6d4mxJjnhbu8",
  y: "FlWkYUKQxfsrWFG5Jg3wzfeE5RFEMT2Vw-aKIE2geok",
});
const WHATSAPP_NUMBER = "593958741463";
const BUSINESS = {
  name: "Marxia Café y Bocaditos",
  address: "Av. Principal y Calle A",
  city: "Guayaquil",
  contact: "+593 99 999 9999",
  logo_url: "",
};

/* DATA */
const VAT = 0.15,
  DELIVERY_FEE = 3.0;
const PRODUCTS = [
  {
    id: "p1",
    name_en: "Option 1",
    name_es: "Opción 1",
    price: 3.2,
    desc_en: "Tortilla, Chorizo, Fried Egg, Drink",
    desc_es: "Tortilla, Chorizo, Huevo frito, Bebida",
  },
  {
    id: "p2",
    name_en: "Option 2",
    name_es: "Opción 2",
    price: 2.7,
    desc_en: "Tortilla, Chorizo, Drink",
    desc_es: "Tortilla, Chorizo, Bebida",
  },
  {
    id: "p3",
    name_en: "Option 3",
    name_es: "Opción 3",
    price: 2.7,
    desc_en: "Tortilla, Fried Egg, Drink",
    desc_es: "Tortilla, Huevo frito, Bebida",
  },
  {
    id: "p4",
    name_en: "Option 4",
    name_es: "Opción 4",
    price: 6.4,
    desc_en: "Tortilla, Chorizo, Fried Egg, Drink (Large)",
    desc_es: "Tortilla, Chorizo, Huevo frito, Bebida (Grande)",
  },
  {
    id: "p5",
    name_en: "Option 5",
    name_es: "Opción 5",
    price: 2.25,
    desc_en: "Tortilla, Drink",
    desc_es: "Tortilla, Bebida",
  },
];

/* STATE */
let lang = localStorage.getItem("lang") || "en";
let theme = localStorage.getItem("theme") || "dark";
const cart = new Map();
let deliveryMinutes = 45;
const gps = { lat: null, lng: null, confirmedAt: null };
const manualAddress = { value: "", confirmedAt: null };
let locationStatus = "idle";
let locationConfirmed = false;
window.locationConfirmed = false;
let suppressAddressFieldListener = false;

const appBindings = {
  getLang: () => lang,
  getBusiness: () => BUSINESS,
  getDeliveryMinutes: () => deliveryMinutes,
  getCart: () => cart,
  getProducts: () => PRODUCTS,
  getTotals: () => totals(),
  formatDeliveryTime: (mins) => formatDeliveryTime(mins),
  getGps: () => gps,
  getManualAddress: () => manualAddress,
  isLocationConfirmed: () => locationConfirmed,
};
window.__appBindings = appBindings;

/* HELPERS */
const $ = (s) => document.querySelector(s);
const track = $("#track");
const t = (en, es) => (lang === "en" ? en : es);
const fmt = (n) => "$" + n.toFixed(2);
const highlightTimers = new WeakMap();
const metricsBase = WORKER_CSAT_BASE;
const VISIT_METRICS_STORAGE_KEY = "visitMetricsCache";
const VISIT_METRICS_CACHE_TTL = 1000 * 60 * 60; // 1 hour
const VISIT_METRIC_ENDPOINTS = (() => {
  const set = new Set();
  const add = (url) => {
    const normalized = normalizeUrlCandidate(url);
    if (normalized) set.add(normalized);
  };
  add(joinWorkerPath(metricsBase, "visits"));
  add(joinWorkerPath(metricsBase, "metrics/visits"));
  add(joinWorkerPath(WORKER_CSAT_URL, "visits"));
  add(joinWorkerPath(WORKER_CSAT_URL, "metrics/visits"));
  add(joinWorkerPath(CLOUDFLARE_WORKER_URL, "visits"));
  add(joinWorkerPath(CLOUDFLARE_WORKER_URL, "metrics/visits"));
  return Array.from(set);
})();

const parseVisitMetricValue = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
};

const coerceVisitMetrics = (input) => {
  if (!input || typeof input !== "object") return null;
  const today = parseVisitMetricValue(input.today ?? input.daily ?? input.day);
  const month = parseVisitMetricValue(input.month ?? input.monthly);
  const year = parseVisitMetricValue(input.year ?? input.annual ?? input.total);
  if (today == null && month == null && year == null) return null;
  return {
    today: today ?? 0,
    month: month ?? 0,
    year: year ?? 0,
  };
};

const applyVisitMetrics = (metrics, source = "live") => {
  if (!metrics) return;
  const data = coerceVisitMetrics(metrics);
  if (!data) return;
  updateVisitMetric("visitsToday", data.today);
  updateVisitMetric("visitsMonth", data.month);
  updateVisitMetric("visitsYear", data.year);
  const chartData = [data.today, data.month, data.year];
  drawBarChart("visitsChart", chartData);
  ["visitsToday", "visitsMonth", "visitsYear"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute("data-source", source);
    }
  });
  if (source === "live") {
    safeStorageSet(
      VISIT_METRICS_STORAGE_KEY,
      JSON.stringify({ ts: Date.now(), metrics: data }),
    );
  }
};

const restoreVisitMetricsFromCache = () => {
  const raw = safeStorageGet(VISIT_METRICS_STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return false;
    const { ts, metrics } = parsed;
    if (!metrics) return false;
    if (
      Number.isFinite(ts) &&
      ts > 0 &&
      Date.now() - ts > VISIT_METRICS_CACHE_TTL
    )
      return false;
    applyVisitMetrics(metrics, "cache");
    return true;
  } catch (err) {
    console.warn("Unable to parse cached visit metrics.", err);
    return false;
  }
};

const applyVisitFallback = (reason) => {
  const fallback = { today: 48, month: 1280, year: 9820 };
  applyVisitMetrics(fallback, reason || "fallback");
};

function updateVisitMetric(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const numeric = Number(value);
  if (!(numeric > 0)) {
    el.textContent = "—";
    el.setAttribute("data-empty", "true");
    return;
  }
  el.textContent = numeric.toLocaleString();
  el.removeAttribute("data-empty");
}
const MAP_EMBED_TEMPLATES = {
  desktop: (coords) =>
    `https://www.google.com/maps?q=${coords}&z=17&output=embed`,
  mobile: (coords) =>
    `https://maps.google.com/maps?q=${coords}&z=17&output=embed`,
};
const MAP_EMBED_ADDRESS_TEMPLATES = {
  desktop: (query) => `https://www.google.com/maps?q=${query}&output=embed`,
  mobile: (query) => `https://maps.google.com/maps?q=${query}&output=embed`,
};
const MAP_SHARE_TEMPLATES = {
  desktop: (coords) => `https://www.google.com/maps/@${coords},17z`,
  mobile: (coords) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`,
};
const MAP_SHARE_ADDRESS_TEMPLATE = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const CSAT_UID_STORAGE_KEY = "csatUid";
const CSAT_FP_STORAGE_KEY = "csatFp";

const csatBytesToHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Unable to read ${key} from storage.`, err);
    return null;
  }
};

const safeStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`Unable to persist ${key} to storage.`, err);
  }
};

const deriveCsatFingerprint = async () => {
  try {
    const components = [
      navigator.userAgent || "",
      navigator.language || "",
      navigator.platform || "",
      String(screen?.width || ""),
      String(screen?.height || ""),
      String(screen?.colorDepth || ""),
      String(window.devicePixelRatio || ""),
      Intl.DateTimeFormat?.().resolvedOptions?.().timeZone || "",
    ].join("|");
    if (window.crypto?.subtle && window.TextEncoder) {
      const data = new TextEncoder().encode(components);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return csatBytesToHex(new Uint8Array(digest));
    }
    return btoa(unescape(encodeURIComponent(components))).slice(0, 64);
  } catch (err) {
    console.warn("Unable to derive CSAT fingerprint.", err);
    return "";
  }
};

const ensureCsatIdentifiers = async () => {
  let uid = safeStorageGet(CSAT_UID_STORAGE_KEY);
  if (!uid) {
    const raw =
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    uid = raw.toLowerCase();
    safeStorageSet(CSAT_UID_STORAGE_KEY, uid);
  }
  let fp = safeStorageGet(CSAT_FP_STORAGE_KEY);
  if (!fp) {
    fp = await deriveCsatFingerprint();
    if (fp) safeStorageSet(CSAT_FP_STORAGE_KEY, fp);
  }
  return { uid, fp };
};

if (typeof window._csatGetIds !== "function") {
  window._csatGetIds = ensureCsatIdentifiers;
}
function isMobileOrTablet() {
  try {
    if (
      navigator.userAgentData &&
      typeof navigator.userAgentData.mobile === "boolean"
    ) {
      return navigator.userAgentData.mobile;
    }
  } catch {}
  const ua = (navigator.userAgent || "").toLowerCase();
  if (/mobi|android|iphone|ipad|tablet/.test(ua)) return true;
  return (
    ("ontouchstart" in window || (navigator.maxTouchPoints || 0) > 1) &&
    window.innerWidth < 1024
  );
}
function detectDefaultMapMode() {
  return isMobileOrTablet() ? "mobile" : "desktop";
}
function coordsForMaps() {
  if (hasCoordinateLocation()) {
    return `${gps.lat},${gps.lng}`;
  }
  return "";
}
function buildMapEmbedUrl(mode) {
  const coords = coordsForMaps();
  if (coords) {
    const template = MAP_EMBED_TEMPLATES[mode] || MAP_EMBED_TEMPLATES.desktop;
    return template(coords);
  }
  const manual = normalizedManualAddress();
  if (manual) {
    const template =
      MAP_EMBED_ADDRESS_TEMPLATES[mode] || MAP_EMBED_ADDRESS_TEMPLATES.desktop;
    return template(encodeURIComponent(manual));
  }
  return "";
}
function buildMapShareUrl(mode) {
  const coords = coordsForMaps();
  if (coords) {
    const template = MAP_SHARE_TEMPLATES[mode] || MAP_SHARE_TEMPLATES.desktop;
    return template(coords);
  }
  const manual = normalizedManualAddress();
  if (manual) {
    return MAP_SHARE_ADDRESS_TEMPLATE(manual);
  }
  return "";
}
function mapModeLabel(mode) {
  return mode === "mobile"
    ? t("Mobile / Tablet map", "Mapa móvil / Tablet")
    : t("PC / Laptop map", "Mapa PC / Laptop");
}
function formatDeliveryTime(mins) {
  if (mins === 45) return t("45 min", "45 min");
  if (mins === 60) return t("1 hr", "1 hr");
  if (mins === 90) return t("1 hr 30 min", "1 hr 30 min");
  return t(`${mins} min`, `${mins} min`);
}
function updateDeliveryTimeDisplays() {
  const display = formatDeliveryTime(deliveryMinutes);
  const summary = $("#t_deliveryTime");
  if (summary) summary.textContent = display;
  const modalDisplay = $("#m_deliveryTime");
  if (modalDisplay) modalDisplay.textContent = display;
}
function setPh(el) {
  const ph = el.getAttribute(lang === "en" ? "data-ph-en" : "data-ph-es");
  if (ph !== null) el.setAttribute("placeholder", ph);
}

const orderDlg = $("#orderDlg");
const mapDlg = $("#mapDlg");
const mapFrame = $("#mapFrame");
const mapStatusEl = $("#mapStatus");
const locAuthDlg = $("#locAuthDlg");
const locAuthStatusEl = $("#locAuthStatus");
const authorizeLocationBtn = $("#authorizeLocationBtn");
const locAuthCancelBtn = $("#locAuthCancel");
const closeLocAuthBtn = $("#closeLocAuth");
const confirmDisclaimer = $("#confirmDisclaimer");
const locationReviewEl = $("#locationReview");
const clearReviewBtn = $("#clearReviewBtn");
const confirmBtnEl = $("#confirmBtn");
const mapModeButtons = document.querySelectorAll("[data-map-tab]");
const mapShareLinks = document.querySelectorAll("[data-map-link]");
const addressDlg = $("#addressDlg");
const addressForm = $("#addressForm");
const addressInput = $("#addressSearchInput");
const addressErrorEl = $("#addressError");
const addressCancelBtn = $("#addressCancelBtn");
const addressAcceptBtn = $("#addressAcceptBtn");
const closeAddressDlgBtn = $("#closeAddressDlg");
const addressField = $("#address");

let locAuthStatusKey = "idle";
let autoOpenMapAfterAuth = true;
let mapMode = detectDefaultMapMode();

function normalizedManualAddress() {
  return manualAddress.value ? manualAddress.value.trim() : "";
}
function hasManualAddress() {
  return normalizedManualAddress().length > 0;
}
function hasCoordinateLocation() {
  return typeof gps.lat === "number" && typeof gps.lng === "number";
}
function hasMapLocation() {
  return hasCoordinateLocation() || hasManualAddress();
}
function setAddressError(visible) {
  if (!addressErrorEl) return;
  if (visible) {
    addressErrorEl.hidden = false;
    addressErrorEl.textContent = t(
      "Please enter a delivery address before continuing.",
      "Ingrese una dirección de entrega antes de continuar.",
    );
  } else {
    addressErrorEl.hidden = true;
  }
}
function showAddressDialog() {
  if (!addressDlg || typeof addressDlg.showModal !== "function") {
    const initialValue =
      normalizedManualAddress() ||
      (addressField ? addressField.value.trim() : "");
    const response = prompt(
      t(
        "Please accurately choose where do you want us to deliver to.",
        "Por favor elija con precisión dónde desea que entreguemos.",
      ),
      initialValue || "",
    );
    const sanitized = response ? response.trim().replace(/\s+/g, " ") : "";
    if (sanitized) {
      manualAddress.value = sanitized;
      manualAddress.confirmedAt = new Date().toISOString();
      gps.lat = null;
      gps.lng = null;
      gps.confirmedAt = null;
      locationStatus = "confirmed";
      setLocationConfirmed(true);
      if (addressField) {
        suppressAddressFieldListener = true;
        addressField.value = sanitized;
        suppressAddressFieldListener = false;
      }
      updateLocationReview();
      updateMapLinks();
      updateMapView();
      const preferredMode = detectDefaultMapMode();
      const shareUrl =
        buildMapShareUrl(preferredMode) ||
        buildMapShareUrl("desktop") ||
        buildMapShareUrl("mobile");
      if (shareUrl) {
        const mapWindow = window.open(shareUrl, "_blank");
        if (mapWindow) {
          mapWindow.opener = null;
        }
      }
    }
    openPay();
    return;
  }
  setAddressError(false);
  if (addressInput) {
    const current =
      normalizedManualAddress() ||
      (addressField ? addressField.value.trim() : "");
    addressInput.value = current;
    setPh(addressInput);
    setTimeout(() => addressInput.focus(), 120);
  }
  addressDlg.showModal();
}
function handleAddressSubmit(e) {
  if (e) {
    e.preventDefault();
  }
  if (!addressInput) {
    if (addressDlg && addressDlg.open) addressDlg.close();
    openPay();
    return;
  }
  const raw = addressInput.value.trim();
  if (!raw) {
    setAddressError(true);
    addressInput.focus();
    return;
  }
  const sanitized = raw.replace(/\s+/g, " ").trim();
  manualAddress.value = sanitized;
  manualAddress.confirmedAt = new Date().toISOString();
  gps.lat = null;
  gps.lng = null;
  gps.confirmedAt = null;
  locationStatus = "confirmed";
  setLocationConfirmed(true);
  if (addressDlg && addressDlg.open) addressDlg.close();
  if (addressField) {
    suppressAddressFieldListener = true;
    addressField.value = sanitized;
    suppressAddressFieldListener = false;
  }
  updateLocationReview();
  updateMapLinks();
  updateMapView();
  const preferredMode = detectDefaultMapMode();
  const shareUrl =
    buildMapShareUrl(preferredMode) ||
    buildMapShareUrl("desktop") ||
    buildMapShareUrl("mobile");
  if (shareUrl) {
    const mapWindow = window.open(shareUrl, "_blank");
    if (mapWindow) {
      mapWindow.opener = null;
    }
  }
  openPay();
}

function highlightMapTabs() {
  mapModeButtons.forEach((btn) => {
    const selected = btn.dataset.mapTab === mapMode;
    btn.classList.toggle("sel", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}
function updateMapLinks() {
  mapShareLinks.forEach((link) => {
    const mode = link.dataset.mapLink;
    const active = mode === mapMode;
    link.dataset.active = active ? "true" : "false";
    link.classList.toggle("active", active);
    const url = buildMapShareUrl(mode);
    if (url) {
      link.href = url;
      link.classList.remove("disabled");
      link.removeAttribute("aria-disabled");
    } else {
      link.removeAttribute("href");
      link.classList.add("disabled");
      link.setAttribute("aria-disabled", "true");
    }
  });
}
function setMapMode(mode) {
  if (!mode || !(mode in MAP_EMBED_TEMPLATES)) return;
  mapMode = mode;
  highlightMapTabs();
  updateMapView();
  updateMapLinks();
}

function renderLocAuthStatus() {
  if (!locAuthStatusEl) return;
  let message = "";
  let alert = false;
  switch (locAuthStatusKey) {
    case "requesting":
      message = t(
        "Requesting secure GPS access…",
        "Solicitando acceso seguro al GPS…",
      );
      break;
    case "error":
      message = t(
        "We could not confirm your delivery location. Enable GPS or adjust permissions, then try again.",
        "No pudimos confirmar su ubicación de entrega. Active el GPS o ajuste los permisos y vuelva a intentarlo.",
      );
      alert = true;
      break;
    case "success":
      message = t(
        "Location detected. Opening the map so you can verify or update the pin.",
        "Ubicación detectada. Abrimos el mapa para que verifique o actualice el punto.",
      );
      break;
    case "ready":
      message = t(
        "We already have a saved location. Review or update it on the next step.",
        "Ya tenemos una ubicación guardada. Revísela o actualícela en el siguiente paso.",
      );
      break;
    default:
      message = "";
  }
  locAuthStatusEl.textContent = message;
  locAuthStatusEl.classList.toggle("alert", alert);
}
function resetLocAuthStatus() {
  if (locationStatus === "error") {
    locAuthStatusKey = "error";
  } else if (hasMapLocation()) {
    locAuthStatusKey = "ready";
  } else {
    locAuthStatusKey = "idle";
  }
  renderLocAuthStatus();
}

function setLocationConfirmed(val) {
  const prev = locationConfirmed;
  locationConfirmed = !!val;
  window.locationConfirmed = locationConfirmed;
  updateLocationReview();
  if (locationConfirmed && !prev) {
    document.dispatchEvent(new CustomEvent("delivery-location-confirmed"));
  }
}
function openMapForConfirmation() {
  if (mapDlg && typeof mapDlg.showModal === "function") {
    updateMapView();
    if (!mapDlg.open) {
      mapDlg.showModal();
    }
  } else if (hasMapLocation()) {
    const shareUrl =
      buildMapShareUrl(mapMode) ||
      buildMapShareUrl("desktop") ||
      buildMapShareUrl("mobile");
    if (shareUrl) {
      const mapWindow = window.open(shareUrl, "_blank");
      if (mapWindow) {
        mapWindow.opener = null;
      }
    }
    alert(
      t(
        "The map opened in a new tab so you can verify your delivery location.",
        "El mapa se abrió en una nueva pestaña para que verifique su ubicación de entrega.",
      ),
    );
  } else {
    alert(
      t(
        "We still need your delivery address before the map can load.",
        "Aún necesitamos su dirección de entrega antes de cargar el mapa.",
      ),
    );
  }
}
function showLocationAuthorization(shouldOpenMap = true) {
  autoOpenMapAfterAuth = shouldOpenMap !== false;
  if (locAuthDlg && typeof locAuthDlg.showModal === "function") {
    resetLocAuthStatus();
    locAuthDlg.showModal();
  } else {
    handleAuthorizeLocation();
  }
}
async function handleAuthorizeLocation() {
  if (hasMapLocation()) {
    if (locAuthDlg && locAuthDlg.open) locAuthDlg.close();
    if (autoOpenMapAfterAuth) openMapForConfirmation();
    return;
  }
  locAuthStatusKey = "requesting";
  renderLocAuthStatus();
  if (authorizeLocationBtn) {
    authorizeLocationBtn.disabled = true;
    authorizeLocationBtn.setAttribute("aria-busy", "true");
  }
  let ok = false;
  try {
    ok = await requestLocation(false);
  } finally {
    if (authorizeLocationBtn) {
      authorizeLocationBtn.disabled = false;
      authorizeLocationBtn.removeAttribute("aria-busy");
    }
  }
  if (ok) {
    locAuthStatusKey = "success";
    renderLocAuthStatus();
    if (locAuthDlg && locAuthDlg.open) locAuthDlg.close();
    if (autoOpenMapAfterAuth) openMapForConfirmation();
  } else {
    locAuthStatusKey = "error";
    renderLocAuthStatus();
    if (mapDlg && mapDlg.open) {
      setMapStatus(
        t(
          "We could not confirm your delivery location. Enable GPS or adjust permissions, then try again.",
          "No pudimos confirmar su ubicación de entrega. Active el GPS o ajuste los permisos y vuelva a intentarlo.",
        ),
        true,
      );
    }
  }
}
async function ensureDeliveryLocationConfirmation() {
  if (locationConfirmed) {
    return true;
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("delivery-location-confirmed", onConfirmed);
      if (mapDlg) mapDlg.removeEventListener("close", onClosed);
      if (locAuthDlg) locAuthDlg.removeEventListener("close", onClosed);
      resolve(result);
    };
    const onConfirmed = () => finish(true);
    const onClosed = () => {
      finish(locationConfirmed);
    };
    document.addEventListener("delivery-location-confirmed", onConfirmed);
    if (mapDlg) mapDlg.addEventListener("close", onClosed);
    if (locAuthDlg) locAuthDlg.addEventListener("close", onClosed);
    showLocationAuthorization(true);
  });
}
async function ensurePaymentConfirmed(payload) {
  if (typeof window.requestPaymentConfirmation === "function") {
    try {
      const result = await window.requestPaymentConfirmation(payload);
      return result === true;
    } catch (err) {
      console.error("Payment confirmation callback failed", err);
      return false;
    }
  }
  return confirm(
    t(
      "Has the payment been confirmed successfully?",
      "¿Se confirmó el pago correctamente?",
    ),
  );
}
function formatTimestamp(ts) {
  if (!ts) return "";
  const locale = lang === "en" ? "en-US" : "es-EC";
  try {
    return new Date(ts).toLocaleString(locale, { hour12: false });
  } catch {
    return ts;
  }
}
function formatCoords() {
  if (typeof gps.lat !== "number" || typeof gps.lng !== "number") return "";
  return `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`;
}
function buildLocationReview() {
  const coords = formatCoords();
  const when = formatTimestamp(gps.confirmedAt);
  const manual = normalizedManualAddress();
  const manualWhen = formatTimestamp(manualAddress.confirmedAt);
  switch (locationStatus) {
    case "pending":
      return {
        review: t(
          "Requesting your delivery location… please allow secure access.",
          "Solicitando su ubicación de entrega… permita el acceso seguro.",
        ),
        state: "pending",
      };
    case "acquired":
      return {
        review: coords
          ? t(
              `Location detected (${coords}). Confirm the map to continue.`,
              `Ubicación detectada (${coords}). Confirme el mapa para continuar.`,
            )
          : t(
              "Location detected. Confirm the map to continue.",
              "Ubicación detectada. Confirme el mapa para continuar.",
            ),
        state: "acquired",
      };
    case "confirmed": {
      if (manual) {
        const base = t(
          `Confirmed address: ${manual}.`,
          `Dirección confirmada: ${manual}.`,
        );
        const whenLine = manualWhen
          ? t(`Confirmed on ${manualWhen}.`, `Confirmado el ${manualWhen}.`)
          : "";
        return {
          review: whenLine ? `${base} ${whenLine}` : base,
          state: "confirmed",
        };
      }
      const coordLine = coords
        ? t(
            `Confirmed coordinates: ${coords}.`,
            `Coordenadas confirmadas: ${coords}.`,
          )
        : t("Delivery location confirmed.", "Ubicación de entrega confirmada.");
      const whenLine = when
        ? t(`Confirmed on ${when}.`, `Confirmado el ${when}.`)
        : "";
      return {
        review: whenLine ? `${coordLine} ${whenLine}` : coordLine,
        state: "confirmed",
      };
    }
    case "error":
      return {
        review: t(
          "We could not confirm your delivery location. Allow GPS access when prompted and try again.",
          "No pudimos confirmar su ubicación de entrega. Permita el acceso GPS cuando se le solicite e inténtelo de nuevo.",
        ),
        state: "error",
      };
    default:
      return {
        review: t(
          "We will ask you to authorize and confirm your delivery location after you click “Confirm Transaction.”",
          "Le pediremos autorizar y confirmar su ubicación de entrega después de presionar “Confirmar transacción”.",
        ),
        state: "idle",
      };
  }
}

function updateLocationReview() {
  if (!locationReviewEl) return;
  const { review, state } = buildLocationReview();
  locationReviewEl.textContent = review;
  locationReviewEl.dataset.state = state;
}
function disclaimerMessage(key = "default") {
  switch (key) {
    case "location":
      return t(
        "Authorize and confirm your delivery location to continue.",
        "Autorice y confirme su ubicación de entrega para continuar.",
      );
    default:
      return t(
        'You must confirm your "Order Delivery Location".',
        'Debe confirmar su "Ubicación de Entrega".',
      );
  }
}
function showDisclaimer(message, key = "default") {
  if (!confirmDisclaimer) return;
  const msg = message ?? disclaimerMessage(key);
  confirmDisclaimer.hidden = false;
  confirmDisclaimer.dataset.key = key;
  confirmDisclaimer.textContent = msg;
}
function hideDisclaimer() {
  if (!confirmDisclaimer) return;
  confirmDisclaimer.hidden = true;
  confirmDisclaimer.textContent = "";
  delete confirmDisclaimer.dataset.key;
}
function setMapStatus(message, isAlert = false) {
  if (!mapStatusEl) return;
  mapStatusEl.textContent = message;
  mapStatusEl.classList.toggle("alert", !!isAlert);
}
function updateMapView() {
  if (!mapDlg) return;
  if (mapFrame) {
    const baseTitle = t(
      "Delivery location map",
      "Mapa de ubicación de entrega",
    );
    mapFrame.setAttribute("title", `${baseTitle} – ${mapModeLabel(mapMode)}`);
  }
  const url = buildMapEmbedUrl(mapMode);
  if (url) {
    if (mapFrame && mapFrame.src !== url) {
      mapFrame.src = url;
    }
    if (hasManualAddress() && !hasCoordinateLocation()) {
      setMapStatus(
        t(
          "Review the map and confirm the highlighted delivery address.",
          "Revise el mapa y confirme la dirección de entrega resaltada.",
        ),
        false,
      );
    } else {
      setMapStatus(
        t(
          "Drag and zoom if needed, then confirm your delivery spot.",
          "Arrastre y ajuste si es necesario, luego confirme su punto de entrega.",
        ),
        false,
      );
    }
  } else {
    if (mapFrame) {
      mapFrame.removeAttribute("src");
    }
    if (locationStatus === "error") {
      setMapStatus(
        t(
          "We could not confirm your delivery location. Enable GPS or adjust permissions, then try again.",
          "No pudimos confirmar su ubicación de entrega. Active el GPS o ajuste los permisos y vuelva a intentarlo.",
        ),
        true,
      );
    } else {
      setMapStatus(
        t(
          "We are waiting for your GPS location. Allow access on your device.",
          "Estamos esperando su ubicación GPS. Permita el acceso en su dispositivo.",
        ),
        true,
      );
    }
  }
  updateMapLinks();
}

let locationRequestPromise = null;
async function requestLocation(auto = false) {
  if (!navigator.geolocation) {
    locationStatus = "error";
    updateLocationReview();
    if (!auto) {
      alert(t("Geolocation not supported", "Geolocalización no soportada"));
    }
    return false;
  }
  if (locationRequestPromise) return locationRequestPromise;
  locationStatus = "pending";
  updateLocationReview();
  if (mapDlg && mapDlg.open) {
    setMapStatus(
      t("Requesting your location...", "Solicitando su ubicación..."),
      false,
    );
  }
  locationRequestPromise = new Promise((resolve) => {
    const onSuccess = (pos) => {
      locationRequestPromise = null;
      gps.lat = pos.coords.latitude;
      gps.lng = pos.coords.longitude;
      gps.confirmedAt = null;
      setLocationConfirmed(false);
      locationStatus = "acquired";
      updateLocationReview();
      updateMapView();
      resolve(true);
    };
    const onError = (err) => {
      locationRequestPromise = null;
      gps.lat = null;
      gps.lng = null;
      gps.confirmedAt = null;
      setLocationConfirmed(false);
      locationStatus = "error";
      updateLocationReview();
      updateMapView();
      if (err && err.code === 1) {
        alert(
          t(
            "Location permission required. Please allow access.",
            "Se requiere permiso de ubicación. Por favor permita el acceso.",
          ),
        );
      } else if (!auto) {
        alert(t("Could not get location", "No se pudo obtener la ubicación"));
      }
      resolve(false);
    };
    const trigger = () =>
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((p) => {
          if (p.state === "denied") {
            onError({ code: 1 });
          } else {
            trigger();
          }
        })
        .catch(() => trigger());
    } else {
      trigger();
    }
  });
  return locationRequestPromise;
}

function resetOrderReview(closeDialog = true) {
  cart.clear();
  renderProducts();
  renderModal();
  recalc();
  [
    "instructions",
    "firstName",
    "lastName",
    "idNumber",
    "phone",
    "email",
    "address",
  ].forEach((id) => {
    const field = $("#" + id);
    if (field) {
      field.value = "";
    }
  });
  deliveryMinutes = 45;
  document.querySelectorAll("#delTimes .chip").forEach((chip, idx) => {
    chip.classList.toggle("sel", idx === 0);
  });
  updateDeliveryTimeDisplays();
  gps.lat = null;
  gps.lng = null;
  gps.confirmedAt = null;
  manualAddress.value = "";
  manualAddress.confirmedAt = null;
  locationStatus = "idle";
  hideDisclaimer();
  setLocationConfirmed(false);
  updateMapView();
  if (mapStatusEl) {
    setMapStatus("", false);
  }
  if (mapDlg && mapDlg.open) {
    mapDlg.close();
  }
  if (locAuthDlg && locAuthDlg.open) {
    locAuthDlg.close();
  }
  if (closeDialog) {
    $("#orderDlg")?.close();
  }
}

function renderProducts() {
  track.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const nm = lang === "en" ? p.name_en : p.name_es;
    const ds = lang === "en" ? p.desc_en : p.desc_es;
    const el = document.createElement("article");
    el.className = "product card";
    el.innerHTML = `
      <div class="product-image">Product Image</div>
      <div class="product-title">${nm}</div>
      <div class="product-desc">${ds}</div>
      <div class="product-price">${fmt(p.price)}</div>
      <div class="qty" aria-label="${t("Quantity", "Cantidad")} ${nm}">
        <button type="button" aria-label="${t("Decrease", "Disminuir")}">−</button>
        <input type="text" inputmode="numeric" value="${cart.get(p.id) || 0}" aria-label="${t("Quantity", "Cantidad")}" />
        <button type="button" aria-label="${t("Increase", "Aumentar")}">+</button>
      </div>`;
    const [minus, input, plus] = el.querySelectorAll(".qty>*");
    plus.addEventListener("click", () => {
      cart.set(p.id, (cart.get(p.id) || 0) + 1);
      input.value = cart.get(p.id);
      recalc();
    });
    minus.addEventListener("click", () => {
      cart.set(p.id, Math.max(0, (cart.get(p.id) || 0) - 1));
      input.value = cart.get(p.id);
      recalc();
    });
    input.addEventListener("input", () => {
      const v = Math.max(
        0,
        Math.min(999, parseInt(input.value.replace(/\D/g, "")) || 0),
      );
      cart.set(p.id, v);
      input.value = v;
      recalc();
    });
    track.appendChild(el);
  });
}

function totals() {
  let sub = 0;
  PRODUCTS.forEach((p) => (sub += p.price * (cart.get(p.id) || 0)));
  const tax = sub * VAT,
    del = sub > 0 ? DELIVERY_FEE : 0,
    total = sub + tax + del;
  return { sub, tax, del, total };
}
function recalc() {
  const { sub, tax, del, total } = totals();
  $("#t_sub").textContent = fmt(sub);
  $("#t_tax").textContent = fmt(tax);
  $("#t_del").textContent = fmt(del);
  $("#t_total").textContent = fmt(total);
}

function syncLang() {
  document.querySelectorAll("[data-en]").forEach((el) => {
    const next = el.getAttribute(lang === "en" ? "data-en" : "data-es");
    if (next !== null) el.textContent = next;
  });
  document.querySelectorAll("[data-ph-en],[data-ph-es]").forEach(setPh);
  $("#langBtn").textContent = lang === "en" ? "ES" : "EN";
  renderProducts();
  recalc();
  updateDeliveryTimeDisplays();
  $("#m_deliveryTime").previousElementSibling.textContent = t(
    "Delivery Time",
    "Tiempo de entrega",
  );
  if (confirmDisclaimer && !confirmDisclaimer.hidden) {
    const key = confirmDisclaimer.dataset.key || "default";
    showDisclaimer(undefined, key);
  }
  updateLocationReview();
  renderLocAuthStatus();
  if (mapDlg && mapDlg.open) updateMapView();
  if (typeof window.updateCsatSentimentLabel === "function")
    window.updateCsatSentimentLabel();
  if (typeof window.updateCsatCountsUI === "function")
    window.updateCsatCountsUI();
  if (window._latestCsatStats) updateCsatSummary(window._latestCsatStats);
}
function syncTheme() {
  document.documentElement.setAttribute("data-theme", theme);
  $("#themeBtn").textContent =
    theme === "light" ? t("Dark", "Oscuro") : t("Light", "Claro");
}
function scrollByCards(d) {
  const c = track.querySelector(".product");
  const dx = c ? c.getBoundingClientRect().width + 16 : 300;
  track.scrollBy({ left: d * dx, behavior: "smooth" });
}

/* Accordion logic */
(function () {
  const head = document.querySelector("#zoneAcc .acc-head");
  const body = document.querySelector("#zoneAcc .acc-body");
  head.addEventListener("click", () => {
    const open = head.classList.toggle("open");
    head.setAttribute("aria-expanded", open ? "true" : "false");
    body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
  });
  // Resize guard
  new ResizeObserver(() => {
    if (head.classList.contains("open"))
      body.style.maxHeight = body.scrollHeight + "px";
  }).observe(body);
})();

/* Modal rendering */
function renderModal() {
  const box = $("#orderItems");
  box.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const q = cart.get(p.id) || 0;
    if (!q) return;
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `<div><strong>${lang === "en" ? p.name_en : p.name_es}</strong>
      <div class="muted text-sm">${lang === "en" ? p.desc_en : p.desc_es}</div></div>
      <div class="inline-qty" data-id="${p.id}">
        <button aria-label="${t("Remove", "Quitar")}">−</button><span>${q}</span>
        <button aria-label="${t("Add", "Agregar")}">+</button></div>`;
    box.appendChild(row);
  });
  box.addEventListener("click", modalQtyHandler, { once: true });
  const { sub, tax, del, total } = totals();
  updateDeliveryTimeDisplays();
  $("#m_sub").textContent = fmt(sub);
  $("#m_tax").textContent = fmt(tax);
  $("#m_del").textContent = fmt(del);
  $("#m_total").textContent = fmt(total);
  updateLocationReview();
}
function modalQtyHandler(e) {
  const box = e.target.closest(".inline-qty");
  if (!box) return;
  const id = box.dataset.id;
  const span = box.querySelector("span");
  if (e.target.textContent === "＋" || e.target.textContent === "+")
    cart.set(id, (cart.get(id) || 0) + 1);
  else if (e.target.textContent === "−" || e.target.textContent === "-")
    cart.set(id, Math.max(0, (cart.get(id) || 0) - 1));
  else return;
  span.textContent = cart.get(id) || 0;
  recalc();
  renderModal();
}

/* CSAT rating */
const ensureCsatStars = (source) => {
  const defaults = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!source || typeof source !== "object") return defaults;
  const stars = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    const value = Number(source[key]);
    stars[key] = Number.isFinite(value) && value > 0 ? value : 0;
  });
  return stars;
};

const toCsatStats = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const base =
    payload.stats && typeof payload.stats === "object"
      ? payload.stats
      : payload;
  const averageRaw = base.average ?? base.avg;
  const totalRaw = base.total ?? base.count;
  if (averageRaw === undefined && totalRaw === undefined) return null;
  const averageNum = Number(averageRaw);
  const totalNum = Number(totalRaw);
  const average = Number.isFinite(averageNum) ? averageNum : 0;
  const total = Math.max(
    0,
    Number.isFinite(totalNum) ? Math.round(totalNum) : 0,
  );
  const sumCandidate = base.sum ?? average * total;
  const sumNum = Number(sumCandidate);
  const sum = Number.isFinite(sumNum)
    ? sumNum
    : Math.round(average * total) || 0;
  const stats = {
    average,
    total,
    sum,
    stars: ensureCsatStars(base.stars),
  };
  if (base.updatedAt !== undefined) {
    const ts = Number(base.updatedAt);
    if (Number.isFinite(ts)) stats.updatedAt = ts;
  }
  ["today", "month", "year"].forEach((key) => {
    if (base[key] !== undefined) {
      const val = Number(base[key]);
      stats[key] = Number.isFinite(val) ? val : 0;
    }
  });
  return stats;
};

function updateCsatSummary(stats) {
  const summaryEl = document.getElementById("csatScore");
  if (!summaryEl) return;
  const normalized = toCsatStats(stats);
  if (!normalized || !(Number(normalized.total) > 0)) {
    summaryEl.textContent = "—";
    summaryEl.hidden = true;
    return;
  }
  const total = Number(normalized.total) || 0;
  const average = Number(normalized.average) || 0;
  const votesLabel = total === 1 ? t("vote", "voto") : t("votes", "votos");
  summaryEl.textContent = `${average.toFixed(2)}/5 • ${total.toLocaleString()} ${votesLabel}`;
  summaryEl.hidden = false;
}

function showCsatStats(raw) {
  const stats = toCsatStats(raw);
  if (!stats) return;
  window._latestCsatStats = stats;
  const avgEl = document.getElementById("csatAverageValue");
  if (avgEl) avgEl.textContent = stats.average.toFixed(2);
  const totalEl = document.getElementById("csatTotalVotes");
  if (totalEl) totalEl.textContent = (stats.total || 0).toLocaleString();
  const votesLabel = document.getElementById("csatVotesLabel");
  if (votesLabel) {
    const label =
      lang === "es"
        ? votesLabel.dataset.es ||
          votesLabel.dataset.en ||
          votesLabel.textContent
        : votesLabel.dataset.en || votesLabel.textContent;
    votesLabel.textContent = label;
  }
  updateCsatSummary(stats);
}

async function logCsatVisit() {
  if (!CSAT_VISIT_ENDPOINT || typeof window._csatGetIds !== "function") return;
  try {
    const { uid, fp } = await window._csatGetIds();
    await fetch(CSAT_VISIT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uid, fp, lang, theme: theme || "dark" }),
    });
  } catch (err) {
    console.warn("Unable to record CSAT visit.", err);
  }
}

function initCsat() {
  let rating = 0;
  const stars = Array.from(document.querySelectorAll(".csat-star-btn"));
  const sentimentLabel = document.getElementById("csatSentiment");
  const sentimentMap = {
    en: [
      { label: "Frustrated" },
      { label: "Unhappy" },
      { label: "Neutral" },
      { label: "Happy" },
      { label: "Delighted" },
    ],
    es: [
      { label: "Frustrado" },
      { label: "Descontento" },
      { label: "Neutral" },
      { label: "Feliz" },
      { label: "Encantado" },
    ],
  };
  const sentimentStars = ["★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"];
  const sentimentDefaults = {
    en: sentimentLabel?.dataset.defaultEn || "Select a rating",
    es: sentimentLabel?.dataset.defaultEs || "Seleccione una calificación",
  };
  const defaultPattern = sentimentLabel?.dataset.defaultPattern || "☆☆☆☆☆";
  let lastSentimentVal = 0;
  const countWrap = document.getElementById("csatCounts");
  let countNodes = countWrap
    ? Array.from(countWrap.querySelectorAll(".csat-count"))
    : [];
  let counts = [0, 0, 0, 0, 0];
  const STORAGE_KEY = "csatCounts";

  const safeParse = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (err) {
      console.warn(`Unable to read ${key} from storage.`, err);
      return fallback;
    }
  };

  if (countNodes.length === counts.length || !countWrap) {
    const saved = safeParse(STORAGE_KEY, []);
    if (Array.isArray(saved)) {
      counts = counts.map((n, i) => {
        const v = Number(saved[i]);
        return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
      });
    }
  }

  const getLeaderRating = () => {
    let bestIdx = -1;
    let bestVal = -1;
    counts.forEach((val, idx) => {
      if (val > bestVal || (val === bestVal && idx > bestIdx)) {
        bestVal = val;
        bestIdx = idx;
      }
    });
    return bestVal > 0 ? bestIdx + 1 : 0;
  };

  const updateCountsUI = () => {
    if (countWrap) {
      countNodes = Array.from(countWrap.querySelectorAll(".csat-count"));
      countNodes.forEach((node) => {
        const ratingIdx = (Number(node.dataset.val) || 0) - 1;
        const val = counts[ratingIdx] || 0;
        const fallbackLabel = lang === "en" ? "Rating" : "Calificación";
        const label =
          lang === "en"
            ? node.dataset.labelEn || ""
            : node.dataset.labelEs || node.dataset.labelEn || "";
        const safeLabel = label || fallbackLabel;
        const text = safeLabel
          ? `${safeLabel}: ${val}`
          : `${val} ${t("ratings", "calificaciones")}`;
        node.setAttribute("aria-label", text);
        node.setAttribute("title", text);
        node.dataset.count = String(val);
        const starDisplay = node.querySelector(".csat-count-stars");
        if (starDisplay) {
          const ratingVal = Math.max(
            1,
            Math.min(5, Number(node.dataset.val) || 0),
          );
          const pattern = "★".repeat(ratingVal) + "☆".repeat(5 - ratingVal);
          starDisplay.textContent = pattern;
        }
        const hiddenLabel = node.querySelector(".csat-count-label");
        if (hiddenLabel) {
          hiddenLabel.textContent = safeLabel;
        }
        const score = node.querySelector(".sentiment-score");
        if (score) {
          score.textContent = val.toLocaleString();
          score.classList.add("visible");
          score.classList.toggle("zero", val === 0);
        }
        const avgDisplay = node.querySelector(".csat-count-average");
        if (avgDisplay) {
          const ratingVal = Math.max(
            0,
            Math.min(5, Number(node.dataset.val) || 0),
          );
          avgDisplay.textContent = (val > 0 ? ratingVal : 0).toFixed(2);
        }
        const totalDisplay = node.querySelector(".csat-count-total");
        if (totalDisplay) {
          totalDisplay.textContent = val.toLocaleString();
        }
        const votesLabelEl = node.querySelector(".csat-count-votes-label");
        if (votesLabelEl) {
          const labelText =
            lang === "es"
              ? votesLabelEl.dataset.es ||
                votesLabelEl.dataset.en ||
                votesLabelEl.textContent
              : votesLabelEl.dataset.en || votesLabelEl.textContent;
          votesLabelEl.textContent = labelText;
        }
      });
      const sorted = [...countNodes].sort((a, b) => {
        const valA = Number(a.dataset.count) || 0;
        const valB = Number(b.dataset.count) || 0;
        if (valA === valB) {
          return (Number(b.dataset.val) || 0) - (Number(a.dataset.val) || 0);
        }
        return valB - valA;
      });
      sorted.forEach((node, idx) => {
        node.classList.toggle(
          "leader",
          idx === 0 && (Number(node.dataset.count) || 0) > 0,
        );
        countWrap.appendChild(node);
      });
      countNodes = sorted;
    }
    const totalVotes = counts.reduce((sum, val) => sum + val, 0);
    const avg = totalVotes
      ? counts.reduce((sum, val, idx) => sum + val * (idx + 1), 0) / totalVotes
      : 0;
    const avgEl = document.getElementById("csatAverageValue");
    if (avgEl) avgEl.textContent = avg.toFixed(2);
    const totalEl = document.getElementById("csatTotalVotes");
    if (totalEl) totalEl.textContent = totalVotes.toLocaleString();
    const votesLabel = document.getElementById("csatVotesLabel");
    if (votesLabel) {
      const label =
        lang === "es"
          ? votesLabel.dataset.es ||
            votesLabel.dataset.en ||
            votesLabel.textContent
          : votesLabel.dataset.en || votesLabel.textContent;
      votesLabel.textContent = label;
    }
    if (!rating) paint(0);
  };

  window.updateCsatCountsUI = updateCountsUI;

  const persistCounts = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch (err) {
      console.warn("Unable to persist CSAT counts.", err);
    }
  };

  const updateCounts = (val) => {
    if (val < 1 || val > counts.length) return;
    counts[val - 1] = (counts[val - 1] || 0) + 1;
    updateCountsUI();
    persistCounts();
  };

  const setSentiment = (val) => {
    lastSentimentVal = val > 0 ? val : 0;
    if (!sentimentLabel) return;
    const labels = sentimentMap[lang] || sentimentMap.en;
    const fallback = sentimentMap.en;
    const defaultText = sentimentDefaults[lang] || sentimentDefaults.en;
    if (lastSentimentVal > 0) {
      const idx = Math.max(
        0,
        Math.min(labels.length - 1, lastSentimentVal - 1),
      );
      const entry =
        labels[idx] ||
        fallback[idx] ||
        fallback[fallback.length - 1] ||
        fallback[0];
      const midIdx = Math.floor(fallback.length / 2);
      const labelText =
        entry?.label ||
        fallback[idx]?.label ||
        fallback[midIdx]?.label ||
        fallback[0]?.label ||
        defaultText;
      sentimentLabel.textContent =
        sentimentStars[idx] || sentimentStars[sentimentStars.length - 1];
      sentimentLabel.setAttribute("aria-label", labelText);
    } else {
      sentimentLabel.textContent = defaultPattern;
      sentimentLabel.setAttribute("aria-label", defaultText);
    }
  };

  window.updateCsatSentimentLabel = () => setSentiment(lastSentimentVal);

  const paint = (val) => {
    const selectedVal = val > 0 ? val : 0;
    const displayVal = selectedVal || getLeaderRating();
    stars.forEach((btn) => {
      const btnVal = Number(btn.dataset.val) || 0;
      const isFilled = displayVal > 0 && btnVal <= displayVal;
      btn.classList.toggle("active", isFilled);
      btn.setAttribute(
        "aria-pressed",
        btnVal === selectedVal ? "true" : "false",
      );
    });
    setSentiment(displayVal);
  };

  const CSAT_ENDPOINT_PREF_KEY = "csatEndpointPref";
  let preferredEndpoint = null;
  try {
    const stored = localStorage.getItem(CSAT_ENDPOINT_PREF_KEY);
    if (stored && WORKER_CSAT_ENDPOINTS.includes(stored)) {
      preferredEndpoint = stored;
    }
  } catch (err) {
    console.warn("Unable to read CSAT endpoint preference.", err);
  }

  const rememberEndpoint = (url) => {
    if (!url) return;
    preferredEndpoint = url;
    try {
      localStorage.setItem(CSAT_ENDPOINT_PREF_KEY, url);
    } catch (err) {
      console.warn("Unable to persist CSAT endpoint preference.", err);
    }
  };

  const orderedEndpoints = () => {
    if (!WORKER_CSAT_ENDPOINTS.length) return [];
    const list = [...WORKER_CSAT_ENDPOINTS];
    if (preferredEndpoint) {
      const idx = list.indexOf(preferredEndpoint);
      if (idx > 0) {
        list.splice(idx, 1);
        list.unshift(preferredEndpoint);
      } else if (idx === -1) {
        list.unshift(preferredEndpoint);
      }
    }
    return list;
  };

  const attemptWorkerRequest = async (endpoint, options = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 6000);
    try {
      const res = await fetch(endpoint, {
        mode: "cors",
        credentials: "omit",
        ...options,
        signal: controller.signal,
      });
      let data = null;
      let parsed = false;
      try {
        data = await res.json();
        parsed = true;
      } catch {
        data = null;
      }
      const explicitFail =
        parsed &&
        data &&
        typeof data === "object" &&
        (data.ok === false || data.success === false);
      if (!res.ok || explicitFail) {
        const message =
          data && typeof data === "object" && (data.error || data.message)
            ? data.error || data.message
            : `csat_http_${res.status}`;
        const error = new Error(message);
        error.code = "server";
        error.status = res.status;
        error.endpoint = endpoint;
        throw error;
      }
      rememberEndpoint(endpoint);
      if (!parsed || data == null) {
        return { ok: true };
      }
      if (
        typeof data === "object" &&
        data.ok === undefined &&
        data.success === undefined
      ) {
        data.ok = true;
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  };

  const sendToWorker = async (entry) => {
    const endpoints = orderedEndpoints();
    if (!endpoints.length) throw new Error("csat_endpoint_missing");
    const submission = {
      rating: entry?.rating,
      lang: entry?.lang,
    };
    if (entry && entry.uid !== undefined && entry.uid !== null)
      submission.uid = entry.uid;
    if (entry && entry.fp !== undefined && entry.fp !== null)
      submission.fp = entry.fp;
    let lastErr = null;
    for (const endpoint of endpoints) {
      try {
        const postUrl = deriveCsatPostUrl(endpoint);
        if (!postUrl) continue;
        return await attemptWorkerRequest(postUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(submission),
        });
      } catch (err) {
        if (err.name === "AbortError") {
          err = new Error("csat_timeout");
          err.code = "timeout";
        }
        err.endpoint = err.endpoint || endpoint;
        lastErr = err;
        if (classifyNetworkError(err)) break;
        continue;
      }
    }
    throw lastErr || new Error("csat_unreachable");
  };

  const classifyNetworkError = (err) => {
    if (!err) return false;
    if (err.name === "AbortError") return true;
    if (err.code === "timeout") return true;
    if (err.code === "server") {
      const status = Number(err.status) || 0;
      if (status === 429) return true;
      if (status >= 500 && status < 600) return true;
      return false;
    }
    const msg = (err.message || "").toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network");
  };

  const queuePending = (entry) => {
    pending.push(entry);
    if (pending.length > MAX_PENDING) pending = pending.slice(-MAX_PENDING);
    persistPending();
  };

  const flushPending = async () => {
    if (!pending.length) return;
    const queue = [...pending];
    pending = [];
    persistPending();
    let latestStats = null;
    for (const entry of queue) {
      try {
        const data = await sendToWorker(entry);
        updateCounts(entry.rating);
        const stats = toCsatStats(data);
        if (stats) latestStats = stats;
      } catch (err) {
        if (classifyNetworkError(err)) {
          pending.push(entry);
        } else {
          console.warn("Dropping CSAT vote due to non-retriable error.", err);
        }
      }
    }
    if (pending.length) persistPending();
    if (latestStats) showCsatStats(latestStats);
  };

  updateCountsUI();

  stars.forEach((btn, i) => {
    const val = Number(btn.dataset.val) || i + 1;
    btn.addEventListener("mouseenter", () => paint(val));
    btn.addEventListener("focus", () => paint(val));
    btn.addEventListener("mouseleave", () => paint(rating));
    btn.addEventListener("blur", () => paint(rating));
    btn.addEventListener("click", () => {
      rating = val;
      paint(rating);
    });
  });

  const rateBtn = document.getElementById("rateBtn");
  const setRateBtnBusy = (busy) => {
    if (!rateBtn) return;
    rateBtn.disabled = !!busy;
    rateBtn.setAttribute("aria-busy", busy ? "true" : "false");
    rateBtn.classList.toggle("is-busy", !!busy);
  };
  rateBtn?.addEventListener("click", async () => {
    if (!rating) {
      alert(t("Please select a rating first.", "Seleccione una calificación."));
      return;
    }
    if (rateBtn?.disabled) return;
    setRateBtnBusy(true);
    let uid;
    let fp;
    if (typeof window._csatGetIds === "function") {
      try {
        const ids = await window._csatGetIds();
        uid = ids?.uid;
        fp = ids?.fp;
      } catch (err) {
        console.warn("Unable to resolve CSAT identifiers.", err);
      }
    }
    const entry = { rating, lang, uid, fp, ts: Date.now() };
    try {
      const data = await sendToWorker(entry);
      updateCounts(rating);
      const stats = toCsatStats(data);
      if (stats) showCsatStats(stats);
      alert(t("Thanks for rating!", "¡Gracias por calificar!"));
      await flushPending();
    } catch (err) {
      console.error("CSAT submission failed", err);
      if (classifyNetworkError(err)) {
        queuePending(entry);
        alert(
          t(
            "We saved your rating and will retry as soon as we reconnect.",
            "Guardamos tu calificación y la enviaremos cuando recuperemos la conexión.",
          ),
        );
      } else {
        const fallbackMsg = t(
          "Could not send your rating. Please try again.",
          "No se pudo enviar su calificación. Inténtelo de nuevo.",
        );
        const errMsg =
          err &&
          err.message &&
          typeof err.message === "string" &&
          !/^csat_/i.test(err.message)
            ? err.message
            : fallbackMsg;
        alert(errMsg);
      }
    } finally {
      setRateBtnBusy(false);
    }
  });

  paint(0);
  updateCountsUI();

  (async () => {
    const tried = new Set();
    const candidates = [];
    CSAT_STATS_ENDPOINTS.forEach((endpoint) => {
      if (endpoint) candidates.push(endpoint);
    });
    orderedEndpoints().forEach((endpoint) => {
      if (endpoint) candidates.push(endpoint);
    });
    for (const endpoint of candidates) {
      if (!endpoint || tried.has(endpoint)) continue;
      tried.add(endpoint);
      try {
        const data = await attemptWorkerRequest(endpoint, { method: "GET" });
        const stats = toCsatStats(data);
        if (stats) {
          showCsatStats(stats);
          return;
        }
        if (data && data.ok) continue;
      } catch (err) {
        if (err.name === "AbortError") {
          err.code = "timeout";
        }
        if (classifyNetworkError(err)) {
          console.warn("CSAT stats unavailable (network)", err);
          break;
        }
        continue;
      }
    }
  })();

  flushPending();
  window.addEventListener("online", flushPending, { once: false });
}

/* Simple charts */
function drawBarChart(id, data) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width,
    h = c.height;
  ctx.clearRect(0, 0, w, h);
  if (!Array.isArray(data) || !data.length) return;
  const safe = data.map((v) =>
    Math.max(0, Number.isFinite(v) ? v : Number(v) || 0),
  );
  if (!safe.some((v) => v > 0)) return;
  const max = Math.max(...safe);
  const barW = w / safe.length - 10;
  const color = getComputedStyle(document.documentElement).getPropertyValue(
    "--accent",
  );
  safe.forEach((v, i) => {
    const x = i * (barW + 10) + 5;
    const bh = max > 0 ? (v / max) * h : 0;
    ctx.fillStyle = color;
    ctx.fillRect(x, h - bh, barW, bh);
  });
}

function drawLineChart(id, data) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width,
    h = c.height;
  ctx.clearRect(0, 0, w, h);
  if (!Array.isArray(data) || data.length < 2) return;
  const safe = data.map((v) =>
    Math.max(0, Number.isFinite(v) ? v : Number(v) || 0),
  );
  if (!safe.some((v) => v > 0)) return;
  const max = Math.max(...safe);
  const step = w / (safe.length - 1);
  const color = getComputedStyle(document.documentElement).getPropertyValue(
    "--accent",
  );
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  safe.forEach((v, i) => {
    const x = i * step;
    const y = h - (max > 0 ? (v / max) * h : 0);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = color;
  safe.forEach((v, i) => {
    const x = i * step;
    const y = h - (max > 0 ? (v / max) * h : 0);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* INIT */
renderProducts();
recalc();
syncLang();
syncTheme();
highlightMapTabs();
updateMapLinks();
initCsat();
logCsatVisit();
async function loadVisitMetrics() {
  ["visitsToday", "visitsMonth", "visitsYear"].forEach((id) =>
    updateVisitMetric(id),
  );
  const hadCache = restoreVisitMetricsFromCache();
  if (!metricsBase || !VISIT_METRIC_ENDPOINTS.length) {
    if (!hadCache) applyVisitFallback("fallback");
    return;
  }
  for (const endpoint of VISIT_METRIC_ENDPOINTS) {
    if (!endpoint) continue;
    const supportsAbort = typeof AbortController !== "undefined";
    let controller = null;
    let timeout = null;
    try {
      if (supportsAbort) {
        controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 8000);
      }
      const response = await fetch(endpoint, {
        mode: "cors",
        credentials: "omit",
        headers: { Accept: "application/json" },
        signal: controller?.signal,
      });
      if (timeout) clearTimeout(timeout);
      if (!response.ok) {
        if (response.status >= 500) {
          console.warn(
            "Visit metrics endpoint returned server error.",
            response.status,
            endpoint,
          );
          continue;
        }
        throw new Error(`bad_status_${response.status}`);
      }
      const payload = await response.json().catch(() => null);
      const visits = payload?.visits ?? payload;
      if (!visits) {
        console.warn("Visit metrics response missing data.", endpoint, payload);
        continue;
      }
      if (!coerceVisitMetrics(visits)) {
        console.warn(
          "Visit metrics response contained invalid values.",
          endpoint,
          payload,
        );
        continue;
      }
      applyVisitMetrics(visits, "live");
      return;
    } catch (err) {
      if (timeout) {
        try {
          clearTimeout(timeout);
        } catch {}
      }
      if (err?.name === "AbortError") {
        console.warn("Visit metrics request timed out.", endpoint);
        continue;
      }
      if (classifyNetworkError && classifyNetworkError(err)) {
        console.warn("Visit metrics request failed (network).", endpoint, err);
        continue;
      }
      console.warn("Unable to load visit metrics.", endpoint, err);
    }
  }
  if (!hadCache) applyVisitFallback("fallback");
}

loadVisitMetrics();

const salesCounts = { today: 12, month: 320, year: 2800 };
$("#salesToday").textContent = salesCounts.today;
$("#salesMonth").textContent = salesCounts.month;
$("#salesYear").textContent = salesCounts.year;
drawLineChart("salesChart", [
  salesCounts.today,
  salesCounts.month,
  salesCounts.year,
]);

$("#prev").addEventListener("click", () => scrollByCards(-1));
$("#next").addEventListener("click", () => scrollByCards(1));
$("#langBtn").addEventListener("click", () => {
  lang = lang === "en" ? "es" : "en";
  localStorage.setItem("lang", lang);
  syncLang();
});
$("#themeBtn").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  syncTheme();
});
$("#clearBtn").addEventListener("click", (e) => {
  e.preventDefault();
  cart.clear();
  renderProducts();
  recalc();
});
$("#delTimes").addEventListener("click", (e) => {
  if (!e.target.classList.contains("chip")) return;
  [...document.querySelectorAll("#delTimes .chip")].forEach((c) =>
    c.classList.remove("sel"),
  );
  e.target.classList.add("sel");
  deliveryMinutes = +e.target.dataset.min;
  updateDeliveryTimeDisplays();
});

const openPay = () => {
  renderModal();
  hideDisclaimer();
  mapMode = detectDefaultMapMode();
  highlightMapTabs();
  if (hasManualAddress()) {
    locationStatus = "confirmed";
    if (!manualAddress.confirmedAt) {
      manualAddress.confirmedAt = new Date().toISOString();
    }
    setLocationConfirmed(true);
  } else if (locationConfirmed && hasCoordinateLocation()) {
    locationStatus = "confirmed";
  } else if (hasCoordinateLocation()) {
    locationStatus = "acquired";
    setLocationConfirmed(false);
  } else {
    locationStatus = "idle";
    setLocationConfirmed(false);
  }
  updateLocationReview();
  updateMapView();
  updateMapLinks();
  orderDlg?.showModal();
};
$("#fabPay").addEventListener("click", showAddressDialog);
$("#closeDlg").addEventListener("click", () => orderDlg?.close());
$("#cancelBtn").addEventListener("click", () => orderDlg?.close());
addressForm?.addEventListener("submit", handleAddressSubmit);
addressInput?.addEventListener("input", () => setAddressError(false));
addressCancelBtn?.addEventListener("click", () => addressDlg?.close());
closeAddressDlgBtn?.addEventListener("click", () => addressDlg?.close());
if (addressDlg) {
  addressDlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    addressDlg.close();
  });
  addressDlg.addEventListener("close", () => {
    setAddressError(false);
    if (addressInput) {
      addressInput.value = "";
    }
  });
}
clearReviewBtn?.addEventListener("click", () => {
  const confirmReset = confirm(
    t(
      "Do you want to clear this order review?",
      "¿Desea limpiar esta revisión del pedido?",
    ),
  );
  if (!confirmReset) return;
  resetOrderReview(true);
});
orderDlg?.addEventListener("close", () => {
  hideDisclaimer();
  if (mapDlg && mapDlg.open) mapDlg.close();
  if (locAuthDlg && locAuthDlg.open) locAuthDlg.close();
  setTimeout(() => {
    setLocationConfirmed(false);
    gps.confirmedAt = null;
    locationStatus = gps.lat != null && gps.lng != null ? "acquired" : "idle";
    updateLocationReview();
  }, 120);
});

if (mapDlg) {
  const closeMap = () => {
    mapDlg.close();
  };
  $("#closeMap")?.addEventListener("click", closeMap);
  $("#mapCancel")?.addEventListener("click", closeMap);
  mapDlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    mapDlg.close();
  });
  mapDlg.addEventListener("close", () => {
    if (mapFrame) mapFrame.removeAttribute("src");
    setMapStatus("", false);
    if (confirmBtnEl) {
      setTimeout(() => {
        confirmBtnEl.focus();
      }, 120);
    }
  });
  $("#mapConfirm")?.addEventListener("click", async () => {
    if (!hasCoordinateLocation() && !hasManualAddress()) {
      setMapStatus(
        t(
          "We still do not have your delivery address or GPS coordinates. Please authorize location or enter your address, then try again.",
          "Aún no tenemos su dirección de entrega ni coordenadas GPS. Autorice la ubicación o ingrese su dirección y vuelva a intentarlo.",
        ),
        true,
      );
      await requestLocation(false);
      updateMapView();
      return;
    }
    if (hasManualAddress() && !hasCoordinateLocation()) {
      manualAddress.confirmedAt = new Date().toISOString();
    } else {
      gps.confirmedAt = new Date().toISOString();
    }
    locationStatus = "confirmed";
    setLocationConfirmed(true);
    hideDisclaimer();
    setMapStatus(
      t("Delivery location confirmed.", "Ubicación de entrega confirmada."),
      false,
    );
    mapDlg.close();
    if (confirmBtnEl) {
      setTimeout(() => {
        confirmBtnEl.focus();
      }, 120);
    }
  });
}

if (locAuthDlg) {
  const closeLocAuth = () => {
    locAuthDlg.close();
  };
  closeLocAuthBtn?.addEventListener("click", closeLocAuth);
  locAuthCancelBtn?.addEventListener("click", closeLocAuth);
  authorizeLocationBtn?.addEventListener("click", () => {
    handleAuthorizeLocation();
  });
  locAuthDlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    locAuthDlg.close();
  });
  locAuthDlg.addEventListener("close", () => {
    locAuthStatusKey = "idle";
    renderLocAuthStatus();
    if (authorizeLocationBtn) {
      authorizeLocationBtn.disabled = false;
      authorizeLocationBtn.removeAttribute("aria-busy");
    }
    if (orderDlg && orderDlg.open && confirmBtnEl) {
      setTimeout(() => {
        confirmBtnEl.focus();
      }, 120);
    }
  });
} else {
  authorizeLocationBtn?.addEventListener("click", () => {
    handleAuthorizeLocation();
  });
}

if (addressField) {
  addressField.addEventListener("input", () => {
    if (suppressAddressFieldListener) return;
    const manualCurrent = normalizedManualAddress();
    if (!manualCurrent) return;
    const currentValue = addressField.value.trim();
    if (currentValue === manualCurrent) return;
    manualAddress.value = "";
    manualAddress.confirmedAt = null;
    if (!hasCoordinateLocation()) {
      locationStatus = "idle";
      if (locationConfirmed) {
        setLocationConfirmed(false);
      } else {
        updateLocationReview();
      }
      updateMapLinks();
      updateMapView();
    }
  });
}

mapModeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mapTab;
    if (mode) setMapMode(mode);
  });
});
mapShareLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const mode = link.dataset.mapLink;
    if (mode) setMapMode(mode);
  });
});

// Submit to backend + WhatsApp
$("#confirmBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  hideDisclaimer();

  const firstName = $("#firstName").value.trim();
  const lastName = $("#lastName").value.trim();
  const idNumber = $("#idNumber").value.trim();
  const phone = $("#phone").value.trim();
  const email = $("#email").value.trim();
  const address = $("#address").value.trim();
  const instructions = $("#instructions").value.trim();
  const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOK = /^\+?593\d{9,10}$/.test(phone) || /^0\d{8,9}$/.test(phone);
  if (
    !firstName ||
    !lastName ||
    !idNumber ||
    !phoneOK ||
    !emailOK ||
    !address
  ) {
    alert(
      t(
        "Please fill all fields with valid data (Name, Last name, Céd/RUC, EC phone, Email, Address).",
        "Complete todos los campos con datos válidos (Nombre, Apellido, Céd/RUC, teléfono EC, Correo, Dirección).",
      ),
    );
    return;
  }
  const items = PRODUCTS.map((p) => ({
    id: p.id,
    name: lang === "en" ? p.name_en : p.name_es,
    desc: lang === "en" ? p.desc_en : p.desc_es,
    qty: cart.get(p.id) || 0,
    unit: p.price,
  })).filter((i) => i.qty > 0);
  if (!items.length) {
    alert(t("Your cart is empty.", "Su carrito está vacío."));
    return;
  }
  const { sub, tax, del, total } = totals();
  const deliveryDisplay = formatDeliveryTime(deliveryMinutes);

  const locationReady = await ensureDeliveryLocationConfirmation();
  const hasDeliveryLocation =
    locationConfirmed && (hasCoordinateLocation() || hasManualAddress());
  if (!locationReady || !hasDeliveryLocation) {
    showDisclaimer(undefined, "location");
    return;
  }

  const timestamp = new Date().toISOString();
  const desktopMapLink = buildMapShareUrl("desktop");
  const mobileMapLink = buildMapShareUrl("mobile");
  const mapLinks = {
    desktop: desktopMapLink || null,
    mobile: mobileMapLink || null,
  };
  const gpsData = { lat: gps.lat, lng: gps.lng, confirmedAt: gps.confirmedAt };
  if (manualAddress.value) {
    gpsData.addressQuery = manualAddress.value;
    gpsData.confirmedAt = manualAddress.confirmedAt || gps.confirmedAt;
  }
  const orderPayload = {
    lang,
    timestamp,
    business: BUSINESS,
    customer: {
      firstName,
      lastName,
      idNumber,
      phone,
      email,
      address,
      gps: gpsData,
      locationConfirmed,
      city: "",
      mapLinks,
    },
    delivery: {
      minutes: deliveryMinutes,
      fee: DELIVERY_FEE,
      included: true,
      display: deliveryDisplay,
    },
    cart: {
      items,
      subtotal: sub,
      vat: tax,
      delivery: del,
      total,
      instructions,
    },
  };
  if (!mapLinks.desktop && !mapLinks.mobile) {
    delete orderPayload.customer.mapLinks;
  }
  const paymentPayload = {
    lang,
    timestamp,
    business: BUSINESS,
    customer: { firstName, lastName, address },
    delivery: orderPayload.delivery,
    cart: { items, subtotal: sub, vat: tax, delivery: del, total },
  };

  const paymentConfirmed = await ensurePaymentConfirmed(paymentPayload);
  if (!paymentConfirmed) {
    alert(
      t(
        "We will wait for the payment confirmation before sending the order.",
        "Esperaremos la confirmación del pago antes de enviar el pedido.",
      ),
    );
    return;
  }

  let workerInitToken = "";
  if (typeof window.initializeWorkerTransaction === "function") {
    try {
      const workerResult = await window.initializeWorkerTransaction(
        orderPayload,
        {
          policy: "OPS",
          context: {
            lang,
            business: BUSINESS,
            deliveryMinutes,
            deliveryDisplay,
            formatDeliveryTime,
            gps: gpsData,
          },
        },
      );
      if (workerResult && workerResult.ok && workerResult.token) {
        workerInitToken = String(workerResult.token);
      } else if (workerResult && workerResult.error) {
        console.warn("Worker initialization error:", workerResult.error);
      }
    } catch (err) {
      console.error("Unable to initialize encrypted worker transaction.", err);
    }
  }

  if (typeof window.forwardPIIToWorker === "function") {
    try {
      await window.forwardPIIToWorker();
    } catch (err) {
      console.error("Secure PII forwarding failed.", err);
    }
  }

  try {
    if (CLOUDFLARE_WORKER_URL) {
      await fetch(CLOUDFLARE_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderPayload,
          apps_script_url: APPS_SCRIPT_URL,
        }),
      });
    } else if (APPS_SCRIPT_URL) {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
    }
  } catch (e) {
    console.warn("Backend request failed:", e);
  }
  let maps = "";
  if (locationConfirmed) {
    const mapLines = [];
    if (desktopMapLink) {
      mapLines.push(
        `${t("Map (PC/Laptop)", "Mapa (PC/Portátil)")}: ${desktopMapLink}`,
      );
    }
    if (mobileMapLink) {
      mapLines.push(
        `${t("Map (Mobile/Tablet)", "Mapa (Móvil/Tablet)")}: ${mobileMapLink}`,
      );
    }
    if (mapLines.length) {
      maps = `\n${mapLines.join("\n")}`;
    }
  }
  let confirmationLine;
  if (locationConfirmed) {
    if (manualAddress.value) {
      const ts = formatTimestamp(manualAddress.confirmedAt || gps.confirmedAt);
      confirmationLine = ts
        ? `${t("Address confirmed at", "Dirección confirmada el")} ${ts}`
        : t("Delivery address confirmed", "Dirección de entrega confirmada");
    } else if (gps.confirmedAt) {
      confirmationLine = `${t("Location confirmed at", "Ubicación confirmada el")} ${formatTimestamp(gps.confirmedAt)}`;
    } else {
      confirmationLine = t(
        "Delivery location confirmed",
        "Ubicación de entrega confirmada",
      );
    }
  } else {
    confirmationLine = t(
      "Location confirmation pending",
      "Confirmación de ubicación pendiente",
    );
  }
  const lines = items
    .map((i) => `• ${i.name} x${i.qty} = ${fmt(i.qty * i.unit)}`)
    .join("\n");
  const msg = `${t("Order", "Pedido")} – ${BUSINESS.name}\n\n${t("Customer", "Cliente")}: ${firstName} ${lastName}\nID: ${idNumber}\nTel: ${phone}\nEmail: ${email}\nDir: ${address}${maps}\n${confirmationLine}\n\n${t("Items Purchased", "Artículos")}\n${lines}\n\n${t("Delivery Time", "Tiempo de entrega")}: ${deliveryDisplay}\nSubtotal: ${fmt(sub)}\n${t("VAT 15%", "IVA 15%")}: ${fmt(tax)}\n${t("Delivery", "Entrega")}: ${fmt(del)}\n${t("Total", "Total")}: ${fmt(total)}\n\n${t("Instructions", "Instrucciones")}: ${instructions || "-"}`;
  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
  $("#orderDlg").close();
  const tokenLine = workerInitToken
    ? `\n${t("Transaction token", "Token de transacción")}: ${workerInitToken}`
    : "";
  alert(
    `${t("Order sent. We also opened WhatsApp with the details.", "Pedido enviado. También abrimos WhatsApp con los detalles.")}${tokenLine}`,
  );
});

document.addEventListener("click", (e) => {
  const interactive = e.target.closest("button, a");
  if (!interactive) return;
  interactive.classList.add("click-highlight");
  if (highlightTimers.has(interactive))
    clearTimeout(highlightTimers.get(interactive));
  const timer = setTimeout(() => {
    interactive.classList.remove("click-highlight");
    highlightTimers.delete(interactive);
  }, 3000);
  highlightTimers.set(interactive, timer);
});

// Keyboard arrows for carousel
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") scrollByCards(-1);
  if (e.key === "ArrowRight") scrollByCards(1);
});
