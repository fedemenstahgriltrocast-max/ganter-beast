"use strict";

// Forward sanitized PII to Cloudflare worker when Pay button is clicked
(function(){
  // Public key metadata for verifying worker challenge or encryption schemes
  const KEY_ID = "kid-ef90b3da-9bcb-4c21-89b9-f7d24dc16ef4";
  const FINGERPRINT_SHA256 = "F5E8565ED05E14C568EC7A8F85B2FA1204FCDBBD3D358B6D693CC0EE1EA3D435";
  const FINGERPRINT_SHA384 = "AB4B9A4E8755ABA77CFA3530FA7D6D3E3B9369329FB8F4F709066703E918ACD7704517649FBEF029E3546DDB3435207D";
  const PUBLIC_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2hYmEzD+89YxVheM
mumCxbOwFjkAVKkTbf9sWvMD9C6hRANCAARIePnEjWxRmTXqJ7U1KmRzjAR9q3Nt
gDoVQVb2jh09H+Hc1ZQ3cokJXaoNrrblLa9GZHVxKaEBMSFacp7rKkFR
-----END PRIVATE KEY-----`;
  const PUBLIC_JWK = {
    "crv": "P-256",
    "ext": true,
    "key_ops": ["verify"],
    "kty": "EC",
    "x": "SHj5xI1sUZk16ie1NSpkc4wEfatzbYA6FUFW9o4dPR8",
    "y": "4dzVlDdyiQldqg2utuUtr0ZkdXEpoQExIVpynusqQVE"
  };

  const workerUrl = window.CLOUDFLARE_WORKER_URL;
  if(!workerUrl){
    console.warn("CLOUDFLARE_WORKER_URL not configured");
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
    try{
      const payload = { pii: collectPII(), order: collectOrder() };
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          "X-Key-Id": KEY_ID
        },
        body: JSON.stringify(payload),
        credentials: "omit"
      });
      if(res.ok){
        const data = await res.json().catch(()=>({}));
        if(data.payUrl){
          window.open(data.payUrl, "_blank", "noopener");
        }
      } else {
        console.error("Worker responded with", res.status);
      }
    }catch(err){
      console.error("PII forward failed", err);
    }
  }

  document.getElementById("confirmBtn")?.addEventListener("click", forwardPII);
})();
