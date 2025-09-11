"use strict";

// Forward sanitized PII to Cloudflare worker when Pay button is clicked
(function(){
  // Public key metadata for verifying worker challenge or encryption schemes
  const KEY_ID = "kid-db403386-b31e-4f58-9693-ef8d8fda3286";
  const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAER51NxAn+9rneOrpa/dtkeBQRlRMs\n7fXNFqdFHmbknZ+S0x0nEf1xOzwal23wx4GPID93F8ffkedxe9dAHP1btw==\n-----END PUBLIC KEY-----`;
  const PUBLIC_JWK = {
    "crv": "P-256",
    "ext": true,
    "key_ops": [],
    "kty": "EC",
    "x": "R51NxAn-9rneOrpa_dtkeBQRlRMs7fXNFqdFHmbknZ8",
    "y": "ktMdJxH9cTs8Gpdt8MeBjyA_dxfH35HncXvXQBz9W7c"
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

  async function forwardPII(){
    try{
      const pii = collectPII();
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          "X-Key-Id": KEY_ID
        },
        body: JSON.stringify(pii),
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
