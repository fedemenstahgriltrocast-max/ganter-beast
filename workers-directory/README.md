# Workers Directory

This folder documents and stores Cloudflare Worker scripts that support the Marxia Café y Bocaditos experience. Each worker aligns with the OPS Cyber Sec Core Framework and PCI DSS requirements.

## Available Workers

### `sequence-worker.js`
Queues inbound form submissions, validates payloads, and forwards sanitized data to downstream APIs over HTTPS. Implements:
- Strict JSON schema validation.
- CORS enforcement with an allowlist of origins.
- Structured logging without sensitive data (PCI DSS Req.10).
- Replay protection through idempotency tokens.

### `encryption-gateway.js`
Provides serverless encryption and decryption endpoints using the helpers in `../encryption-directory/aes-gcm.js`.
- Requires bearer token authentication (least privilege, PCI DSS Req.8).
- Enforces HTTPS-only requests and rate limiting.
- Utilizes per-request salts and IVs to avoid key reuse.

## Deployment Checklist
1. Configure secrets with `wrangler secret put` (tokens, encryption passphrases).
2. Deploy via `wrangler deploy` with production bindings and R2/KV namespaces as required.
3. Monitor with Cloudflare Logs/SIEM integration for anomaly detection (DE.CM & PCI DSS Req.10).
4. Conduct semi-annual penetration tests and tabletop exercises (PCI DSS Req.11.3, RS.IM).
