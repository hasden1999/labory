import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  createBackupSessionToken,
  verifyBackupSessionToken,
  BACKUP_SESSION_TTL_MS,
  timingSafeEqualStr,
} from './backupTokenUtils';

export { createBackupSessionToken, verifyBackupSessionToken };

const DATA_DIR = process.env.LABRYO_DATA_DIR
  ? path.resolve(process.env.LABRYO_DATA_DIR)
  : process.env.VERCEL
    ? path.join('/tmp', 'labryo_data')
    : path.resolve(
        process.cwd().includes('apps')
          ? process.cwd()
          : path.join(process.cwd(), 'apps', 'web'),
        'data'
      );

const SECRET_DIR = path.join(DATA_DIR, 'secrets');
const SECRET_FILE = path.join(SECRET_DIR, 'backup.key');

/**
 * Reads `process.env.BACKUP_ADMIN_SECRET`. If not configured in the environment,
 * reads or generates a persistent 32-byte random hex key at `<DATA_DIR>/secrets/backup.key`,
 * caches it into `process.env.BACKUP_ADMIN_SECRET`, and returns it.
 */
export function getOrCreateBackupSecret(): string {
  const existing = (process.env.BACKUP_ADMIN_SECRET || '').trim();
  if (existing.length > 0) {
    return existing;
  }

  try {
    if (fs.existsSync(SECRET_FILE)) {
      const stored = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
      if (stored.length >= 32) {
        process.env.BACKUP_ADMIN_SECRET = stored;
        return stored;
      }
    }
  } catch {}

  const generated = crypto.randomBytes(32).toString('hex');
  try {
    if (!fs.existsSync(SECRET_DIR)) {
      fs.mkdirSync(SECRET_DIR, { recursive: true });
    }
    fs.writeFileSync(SECRET_FILE, generated, { encoding: 'utf-8', mode: 0o600 });
  } catch {}

  process.env.BACKUP_ADMIN_SECRET = generated;
  return generated;
}

/**
 * Synchronous verification for Node.js route handlers (`backupSecurity.ts`).
 */
export function verifyBackupSessionTokenSync(
  token: string | null | undefined,
  secret: string
): boolean {
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

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${issuedAtStr}.${nonce}`)
    .digest('hex');

  return timingSafeEqualStr(providedSig, expectedSig);
}
