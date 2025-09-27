# Encryption Directory

This folder centralizes the cryptographic helpers and operational guidance for Marxia Café y Bocaditos. The goal is to ensure that any sensitive customer or order data is protected in flight and at rest in line with the OPS Cyber Sec Core Framework, NIST CSF, CISA Cyber Essentials, and PCI DSS requirements.

## Controls in Scope
- **AES-256-GCM** for authenticated encryption.
- **PBKDF2** key derivation with SHA-256 to stretch human-readable passphrases.
- **Unique IVs** per encryption request with automatic reuse detection.
- **Integrity tags** returned alongside ciphertext for tamper detection.
- **Deterministic serialization** of payload metadata to avoid parsing ambiguity.
- **Input validation** and zeroization of intermediate buffers where possible in JavaScript runtimes.

## Implementation Files
- `aes-gcm.js` – Small, dependency-free module for encrypting and decrypting JSON payloads with AES-256-GCM. The helper enforces minimum entropy for passphrases and refuses to operate if the runtime lacks the Web Crypto API.

## Operational Guidance
1. **Key Management** – Store master secrets in an HSM, KMS, or Cloudflare Workers secret. Rotate at least every 90 days (PCI DSS Req.3) and immediately after any suspected exposure.
2. **Derivation Policy** – Derive per-session keys via PBKDF2 with a minimum of 310,000 iterations and a 16-byte salt. Persist the salt adjacent to the ciphertext.
3. **Transport Security** – Always transmit encrypted payloads over TLS 1.2+ with strong cipher suites (NIST SP 800-52r2).
4. **Logging** – Never log plaintext. Audit logs should only retain high-level metadata (PCI DSS Req.10).
5. **Incident Response** – Follow the documented IR plan (RS.RP). If compromise is suspected, revoke affected keys, re-encrypt data, and document lessons learned (RC.IM).

For integration examples see `workers-directory/encryption-gateway.js`.
