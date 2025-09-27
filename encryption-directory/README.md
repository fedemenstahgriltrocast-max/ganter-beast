# Encryption Utilities

This directory contains standalone cryptographic helpers that can be shared by
edge workers and other runtimes across the project.  The focus is on
implementing modern, standards-aligned primitives without bundling sensitive
material directly in the repository.  All guidance follows a blended approach
derived from the NIST Cybersecurity Framework (CSF), CISA Cyber Essentials and
PCI DSS requirements for data protection (Req. 3 & 4).

## Design goals

- **Zero trust inputs** – every function treats external input as untrusted and
  performs tight validation to prevent misuse or injection attacks.
- **Strong encryption defaults** – AES-256-GCM is used for authenticated
  encryption, with PBKDF2-HMAC-SHA-256 key derivation and 100k iterations by
  default.  This aligns with NIST SP 800-132 guidance for password-based key
  derivation.
- **Secure randomness** – all randomness uses `crypto.getRandomValues` so the
  output is safe for IV/salt material, satisfying PCI DSS Req. 3.6.1.
- **Interoperability** – the utilities are authored as ES modules so they can be
  imported by Cloudflare Workers or bundled client applications when needed.
- **Observability** – helper functions surface structured errors to support
  centralized logging and monitoring, consistent with PCI DSS Req. 10.

## Files

- `aes-gcm.js` – core utility that exposes helpers for key derivation,
  encryption and decryption using AES-GCM.

## Operational controls

- Store master secrets in an HSM/KMS or per-environment secret manager.
- Rotate secrets on a 90-day cadence and immediately after any incident
  involving credential exposure (NIST PR.AC, PCI DSS Req. 3.5).
- Maintain audit logging for all encryption/decryption requests and monitor via
  SIEM for anomaly detection (NIST DE.CM).
- Couple these utilities with a formal incident response plan to ensure rapid
  containment if a compromise is detected (NIST RS.RP, PCI DSS Req. 12).

