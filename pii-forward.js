"use strict";

// Forward sanitized PII to Cloudflare worker when Pay button is clicked
(function(){
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
        headers: {"Content-Type":"application/json"},
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
