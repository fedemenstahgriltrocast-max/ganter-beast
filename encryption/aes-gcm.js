// encryption/aes-gcm.js
// Modern AES-GCM helpers with PBKDF2 key derivation.  The implementation is
// compatible with Web Crypto enabled runtimes such as browsers, Workers and
// recent versions of Node.js.

const subtle = (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) || null;
const getRandomValues = (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues?.bind(globalThis.crypto)) || null;

if (!subtle || !getRandomValues) {
  throw new Error('Web Crypto API is required for AES-GCM helpers.');
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DEFAULT_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // 128-bit salt per NIST SP 800-132 guidance
const IV_LENGTH = 12;   // 96-bit IV recommended for AES-GCM

/**
 * Derive an AES-256-GCM CryptoKey from a passphrase and salt.
 * @param {string} secret - High entropy secret (store in KMS/HSM).
 * @param {Uint8Array} salt - Random salt unique per encryption.
 * @param {number} iterations - PBKDF2 iterations (>= 100k for PCI DSS).
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(secret, salt, iterations = DEFAULT_ITERATIONS) {
  if (typeof secret !== 'string' || !secret.trim()) {
    throw new TypeError('Secret must be a non-empty string.');
  }
  if (!(salt instanceof Uint8Array) || salt.length < 8) {
    throw new TypeError('Salt must be a Uint8Array with length >= 8.');
  }
  if (!Number.isFinite(iterations) || iterations < 10_000) {
    throw new TypeError('PBKDF2 iterations must be >= 10_000.');
  }

  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: Math.floor(iterations),
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a UTF-8 string using AES-256-GCM.
 * @param {string} secret - High entropy secret.
 * @param {string} plaintext - UTF-8 payload to protect.
 * @param {object} [options]
 * @param {string} [options.associatedData] - Additional data to authenticate.
 * @param {number} [options.iterations] - Override PBKDF2 iterations.
 * @returns {Promise<{ciphertext:string, iv:string, salt:string}>}
 */
export async function encryptString(secret, plaintext, options = {}) {
  if (typeof plaintext !== 'string') {
    throw new TypeError('Plaintext must be a string.');
  }
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(secret, salt, options.iterations ?? DEFAULT_ITERATIONS);

  const additionalData = typeof options.associatedData === 'string'
    ? encoder.encode(options.associatedData)
    : undefined;

  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
    iv: toBase64(iv),
    salt: toBase64(salt)
  };
}

/**
 * Decrypt AES-256-GCM output produced by encryptString.
 * @param {string} secret
 * @param {{ciphertext:string, iv:string, salt:string, associatedData?:string, iterations?:number}} payload
 * @returns {Promise<string>}
 */
export async function decryptString(secret, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('Payload must be an object.');
  }

  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  const key = await deriveKey(secret, salt, payload.iterations ?? DEFAULT_ITERATIONS);

  const additionalData = typeof payload.associatedData === 'string'
    ? encoder.encode(payload.associatedData)
    : undefined;

  const plaintextBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    ciphertext
  );

  return decoder.decode(plaintextBuffer);
}

/**
 * Generate cryptographically secure random bytes.
 * @param {number} length
 * @returns {Uint8Array}
 */
export function randomBytes(length) {
  if (!Number.isFinite(length) || length <= 0) {
    throw new TypeError('Length must be a positive number.');
  }
  const out = new Uint8Array(Math.floor(length));
  getRandomValues(out);
  return out;
}

export function toBase64(uint8) {
  if (!(uint8 instanceof Uint8Array)) {
    throw new TypeError('Expected Uint8Array for base64 encoding.');
  }
  let binary = '';
  for (let i = 0; i < uint8.length; i += 1) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

export function fromBase64(base64) {
  if (typeof base64 !== 'string' || !base64.trim()) {
    throw new TypeError('Base64 input must be a non-empty string.');
  }
  const normalized = base64.replace(/\s+/g, '');
  const binary = atob(normalized);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export default {
  deriveKey,
  encryptString,
  decryptString,
  randomBytes,
  toBase64,
  fromBase64
};

