# CSP & CORS Reference

This document collects the security headers and policies that were previously embedded in the legacy homepage. Keeping them in one place ensures governance alignment while allowing the production HTML to remain minimal.

## Recommended HTTP Response Headers

| Header | Purpose | Example Value |
| --- | --- | --- |
| `Content-Security-Policy` | Restrict the origins that can serve scripts, styles, and other assets. | `default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; form-action 'self'` |
| `Strict-Transport-Security` | Force HTTPS per browser (NIST PR.AC). | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | Prevent clickjacking (PCI DSS Req.6). | `DENY` |
| `Referrer-Policy` | Limit outbound referrer leakage. | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | Mitigate MIME sniffing. | `nosniff` |
| `X-XSS-Protection` | Legacy defense for older browsers. | `0` |
| `Permissions-Policy` | Restrict powerful APIs (camera, geolocation). | `camera=(), geolocation=(), microphone=()` |

## CORS Guidance
- Allow only trusted storefront origins. Update the allowlist in `workers-directory/sequence-worker.js`.
- Always answer preflight requests with the minimum required headers and a short max age.
- Avoid wildcard `Access-Control-Allow-Credentials` unless cookies are required.
- Log denied origins for anomaly detection (DE.AE) and audit (PCI DSS Req.10).

## Incident Response Checklist
1. Document any policy changes through the governance dashboard (ID.GV).
2. Notify security and legal stakeholders if policies are loosened temporarily.
3. Validate new directives in staging before production deployment.
