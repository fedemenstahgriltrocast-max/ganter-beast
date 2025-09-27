/**
 * AES-256-GCM helpers with PBKDF2 key derivation.
 * Works anywhere the Web Crypto API is available (modern browsers, Cloudflare Workers, Deno, Node 19+).
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const MIN_PASSPHRASE_LENGTH = 16; // PCI DSS Req.3 – reasonable entropy
const PBKDF2_ITERATIONS = 310000; // aligns with NIST SP 800-63B recommendations
const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const SALT_LENGTH = 16;

const hasBuffer = typeof Buffer !== 'undefined';
const hasBtoa = typeof btoa === 'function';
const hasAtob = typeof atob === 'function';

function toBase64(bytes) {
  if (hasBuffer) {
    return Buffer.from(bytes).toString('base64');
  }
  if (!hasBtoa) {
    throw new Error('Base64 encoding unavailable in this runtime.');
  }
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value) {
  if (hasBuffer) {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }
  if (!hasAtob) {
    throw new Error('Base64 decoding unavailable in this runtime.');
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function assertWebCrypto() {
  if (typeof crypto?.subtle === 'undefined') {
    throw new Error('Web Crypto API not available. Use Node 19+, Deno, or Cloudflare Workers.');
  }
}

function assertPassphrase(passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error('Passphrase must be a string with at least 16 characters.');
  }
}

async function deriveKey(passphrase, salt) {
  assertWebCrypto();
  assertPassphrase(passphrase);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJSON({ passphrase, data }) {
  if (typeof data === 'undefined') {
    throw new Error('Missing data payload');
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(passphrase, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = encoder.encode(JSON.stringify(data));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  );

  return {
    version: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
}

export async function decryptJSON({ passphrase, payload }) {
  const { salt, iv, ciphertext } = payload || {};
  if (!salt || !iv || !ciphertext) {
    throw new Error('Malformed payload: expected salt, iv, ciphertext');
  }

  const saltBytes = fromBase64(salt);
  const ivBytes = fromBase64(iv);
  const cipherBytes = fromBase64(ciphertext);

  const key = await deriveKey(passphrase, saltBytes);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    cipherBytes
  );

  return JSON.parse(decoder.decode(plaintext));
}

export function wipe(buffer) {
  if (!buffer) return;
  if (buffer instanceof Uint8Array || ArrayBuffer.isView(buffer)) {
    buffer.fill(0);
  } else if (buffer instanceof ArrayBuffer) {
    new Uint8Array(buffer).fill(0);
  }
}

export default {
  encryptJSON,
  decryptJSON,
  wipe,
};
