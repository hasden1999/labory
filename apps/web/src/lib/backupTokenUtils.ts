/**
 * Edge-compatible and Node.js-compatible backup token utilities.
 * Uses only Web Crypto API (globalThis.crypto.subtle) without native Node dependencies.
 */

export const BACKUP_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function signHmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createBackupSessionToken(secret: string): Promise<string> {
  const issuedAt = Date.now().toString(10);
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const payload = `${issuedAt}.${nonce}`;
  const sig = await signHmacHex(payload, secret);
  return `lbs1.${payload}.${sig}`;
}

export async function verifyBackupSessionToken(
  token: string | null | undefined,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;
  const clean = token.replace(/^Bearer\s+/i, '').trim();
  if (!clean) return false;

  if (clean === secret) return true;

  if (!clean.startsWith('lbs1.')) return false;
  const parts = clean.split('.');
  if (parts.length !== 4) return false;

  const [, issuedAtStr, nonce, providedSig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || !nonce || !providedSig) return false;
  if (Math.abs(Date.now() - issuedAt) > BACKUP_SESSION_TTL_MS) return false;

  const expectedSig = await signHmacHex(`${issuedAtStr}.${nonce}`, secret);
  return timingSafeEqualStr(providedSig, expectedSig);
}
