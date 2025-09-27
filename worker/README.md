# Worker Services

This directory hosts Cloudflare Worker scripts that back the public site with
secure, policy-aligned APIs.  Each worker adheres to the OPS Cyber Sec Core
Framework, combining controls from NIST CSF, CISA Cyber Essentials and PCI DSS
requirements.  All worker endpoints must enforce authentication, encrypt data
in transit and at rest, and log security-relevant events for centralized
monitoring.

Current workers:

- `sentiment-forwarder.js` – proxies CSAT/visit signals to an internal service.
- `encryption-gateway.js` – exposes a minimal encryption/decryption API for
  workloads that require short-lived secrets.

Operational owners should ensure secrets are managed through Cloudflare
Workers KV/Secrets and rotated regularly.  All configuration changes should be
tracked in Git with clear change-management approvals.

