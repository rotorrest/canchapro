/**
 * Password hashing (PBKDF2) and JWT utilities using Web Crypto API.
 * Available in Cloudflare Workers runtime.
 *
 * Hash format: "pbkdf2:100000:<base64-salt>:<base64-hash>"
 * This is self-contained — the salt and iteration count are in the hash string,
 * so we don't need to store them separately.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

/** Hash a password with PBKDF2-SHA256. Returns a portable hash string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_BYTES * 8
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBits)));

  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltB64}:${hashB64}`;
}

/** Verify a password against a stored PBKDF2 hash string. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes (no "pbkdf2:" prefix) for migration
  if (!storedHash.startsWith("pbkdf2:")) {
    return false; // Reject legacy hashes — force password reset
  }

  const [, iterStr, saltB64, hashB64] = storedHash.split(":");
  const iterations = parseInt(iterStr, 10);
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const expectedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    expectedHash.length * 8
  );

  const actualHash = new Uint8Array(hashBits);

  // Constant-time comparison
  if (actualHash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHash.length; i++) {
    diff |= actualHash[i] ^ expectedHash[i];
  }
  return diff === 0;
}

/** Base64url encode (RFC 7515) */
function base64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Sign a JWT payload with HMAC-SHA256 */
export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  const sig = base64url(String.fromCharCode(...new Uint8Array(signature)));

  return `${header}.${body}.${sig}`;
}

/** Generate a random temporary password */
export function generateTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
