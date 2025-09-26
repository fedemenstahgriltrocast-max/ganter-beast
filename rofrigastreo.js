"use strict";

// Forward sanitized PII to Cloudflare worker when Pay button is clicked
(function(){
  // Public key metadata for verifying worker challenge or encryption schemes
  const KEY_ID = "757cf8b7-4c54-460d-8d09-764ec7cf4db0";
  const FINGERPRINT_SHA256 = "A1BD26C67961EDEA2013A004B15DDD09C71F749DC0963EE58C89F83304BE30DD";
  const FINGERPRINT_SHA384 = "A7E52D931BB443A7934E84628C0903FCD711012575E6A71AFD5258722342D36EE5B18B5EF299C4913188F355363C7E06";
  const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEsIAklhmstrGxFPATsdYtnO/NN4Jr
VY2N64EbwRd0c8rwRnDX0rC1BURZ3d8y/5B1XpURmdigDHgmeq0vQ7ypMw==
-----END PUBLIC KEY-----`;
  const PUBLIC_JWK = Object.freeze({
    "crv": "P-256",
    "ext": true,
    "key_ops": ["verify"],
    "kty": "EC",
    "x": "sIAklhmstrGxFPATsdYtnO_NN4JrVY2N64EbwRd0c8o",
    "y": "8EZw19KwtQVEWd3fMv-QdV6VEZnYoAx4JnqtL0O8qTM"
  });
  const ENCRYPTION_JWK = Object.freeze({
    "crv": "P-256",
    "ext": true,
    "key_ops": [],
    "kty": "EC",
    "x": "uBnUp3ouNZbH8Cq6DMGi1pHJUBCXsNz6d4mxJjnhbu8",
    "y": "FlWkYUKQxfsrWFG5Jg3wzfeE5RFEMT2Vw-aKIE2geok"
  });
  window.CLOUDFLARE_SIGNING_METADATA = Object.freeze({
    keyId: KEY_ID,
    fingerprintSha256: FINGERPRINT_SHA256,
    fingerprintSha384: FINGERPRINT_SHA384,
    pem: PUBLIC_KEY_PEM,
    jwk: PUBLIC_JWK
  });
  window.CLOUDFLARE_ENCRYPTION_JWK = ENCRYPTION_JWK;

  const workerUrl = window.CLOUDFLARE_WORKER_URL;
  if(!workerUrl){
    console.warn("CLOUDFLARE_WORKER_URL not configured");
    window.forwardPIIToWorker = async ()=>false;
    return;
  }

  function sanitizeString(s){
    return typeof s === "string" ? s.normalize("NFKC").trim().replace(/\p{C}/gu, "") : "";
  }

  function collectPII(){
    return {
      firstName: sanitizeString(document.getElementById("firstName")?.value || ""),
      lastName: sanitizeString(document.getElementById("lastName")?.value || ""),
      idNumber: sanitizeString(document.getElementById("idNumber")?.value || ""),
      phone: sanitizeString(document.getElementById("phone")?.value || ""),
      email: sanitizeString(document.getElementById("email")?.value || "").toLowerCase(),
      address: sanitizeString(document.getElementById("address")?.value || "")
    };
  }

  function collectOrder(){
    const order = { items: [], totals: {}, deliveryMinutes: window.deliveryMinutes || 0 };
    try{
      const lang = window.lang || "en";
      if(Array.isArray(window.PRODUCTS) && window.cart instanceof Map){
        window.PRODUCTS.forEach(p => {
          const qty = window.cart.get(p.id);
          if(qty > 0){
            order.items.push({
              id: p.id,
              name: sanitizeString(lang === "en" ? p.name_en : p.name_es),
              qty: qty,
              price: p.price
            });
          }
        });
      }
      if(typeof window.totals === "function"){
        order.totals = window.totals();
      }
    }catch(e){
      console.error("order collection failed", e);
    }
    return order;
  }

  async function forwardPII(){
    if(!window.locationConfirmed){
      return false;
    }
    try{
      const payload = { pii: collectPII(), order: collectOrder() };
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          "X-Key-Id": KEY_ID,
          "X-Key-Fingerprint-SHA256": FINGERPRINT_SHA256
        },
        body: JSON.stringify(payload),
        credentials: "omit"
      });
      if(res.ok){
        const data = await res.json().catch(()=>({}));
        if(data.payUrl){
          window.open(data.payUrl, "_blank", "noopener");
        }
        return true;
      } else {
        console.error("Worker responded with", res.status);
        return false;
      }
    }catch(err){
      console.error("PII forward failed", err);
      throw err;
    }
  }

  window.forwardPIIToWorker = forwardPII;
})();
