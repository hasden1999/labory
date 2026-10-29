import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { machineIdSync } from 'node-machine-id';
import { prisma } from '../prisma';

/**
 * Offline licensing.
 *
 * LIC2-<base64url(canonical)>.<base64url(Ed25519 signature)>
 * Canonical: v2|HWID|YYYY-MM-DD|TIER|LAB_NAME|ISSUED_AT
 *
 * Only the public key ships with the server. The Ed25519 private key stays in
 * %USERPROFILE%\.labryo\keys (or LABRYO_KEY_DIR) and is used exclusively by
 * scripts/license-keygen.mjs.
 */
const DEFAULT_LICENSE_PUBLIC_KEY_B64 =
  'MCowBQYDK2VwAyEAHwzwLueGxJ90Ez8aYJSuaWvDBUcu3+2EhJ3Os+kYWq8=';

// Stable namespace for HWID derivation and the local HWID cache seal.
// It intentionally keeps the historical `LABRYO_LICENSE_SECRET` override so that
// existing HWIDs and seals stay valid after the Ed25519 migration. It is never
// used to sign or verify license keys.
const HWID_NAMESPACE_SECRET =
  process.env.LABRYO_LICENSE_SECRET || 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

function getLicensePublicKey(): crypto.KeyObject | null {
  const raw = (process.env.LABRYO_LICENSE_PUBLIC_KEY || DEFAULT_LICENSE_PUBLIC_KEY_B64).trim();
  if (!raw) return null;
  try {
    const normalized = raw.replace(/\\n/g, '\n');
    if (normalized.includes('BEGIN PUBLIC KEY')) {
      return crypto.createPublicKey(normalized);
    }
    return crypto.createPublicKey({
      key: Buffer.from(normalized, 'base64'),
      format: 'der',
      type: 'spki',
    });
  } catch {
    return null;
  }
}

function getLegacyLicenseSecret(): string | null {
  const secret = process.env.LABRYO_LEGACY_LICENSE_SECRET;
  return secret && secret.trim() ? secret.trim() : null;
}

function legacyLicensesAllowed(): boolean {
  return process.env.LABRYO_ALLOW_LEGACY_LICENSES === '1';
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export interface LicensePayload {
  hwid: string;
  expiryDate: string; // ISO String
  tier: 'TWO_DAYS' | 'WEEKLY' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;
  labName?: string;
  issuedAt?: string;
}

import { execSync } from 'child_process';

let _cachedRawId: string | null = null;
let _cachedCanonicalHwid: string | null = null;
let _cachedLegacyHwid: string | null = null;

function getHwidCachePath(): string | null {
  try {
    const dir = process.env.LABRYO_DATA_DIR
      ? path.resolve(process.env.LABRYO_DATA_DIR)
      : path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, '.hwid_seal.json');
  } catch {
    return null;
  }
}

function loadPersistedHwidCache(): { rawId: string; hwid: string; legacyHwid: string } | null {
  const filePath = getHwidCachePath();
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.rawId || !data.hwid || !data.legacyHwid || !data.seal) return null;
    const expectedSeal = crypto
      .createHmac('sha256', HWID_NAMESPACE_SECRET)
      .update(`${data.rawId}##${data.hwid}##${data.legacyHwid}`)
      .digest('hex');
    if (data.seal === expectedSeal) {
      return { rawId: data.rawId, hwid: data.hwid, legacyHwid: data.legacyHwid };
    }
  } catch {}
  return null;
}

function savePersistedHwidCache(rawId: string, hwid: string, legacyHwid: string): void {
  const filePath = getHwidCachePath();
  if (!filePath) return;
  try {
    const seal = crypto
      .createHmac('sha256', HWID_NAMESPACE_SECRET)
      .update(`${rawId}##${hwid}##${legacyHwid}`)
      .digest('hex');
    fs.writeFileSync(filePath, JSON.stringify({ rawId, hwid, legacyHwid, seal, ts: Date.now() }), 'utf-8');
  } catch {}
}

function getRawMachineId(): string {
  if (_cachedRawId) return _cachedRawId;

  let raw = '';
  if (process.platform === 'win32') {
    const regPaths = [
      'C:\\Windows\\System32\\reg.exe',
      'C:\\Windows\\SysWOW64\\reg.exe',
      'reg.exe',
      'reg',
    ];
    for (const regBin of regPaths) {
      try {
        const out = execSync(`"${regBin}" query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid`, {
          timeout: 6000,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString();
        const match = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
        if (match && match[1]) {
          raw = match[1].trim().toLowerCase();
          break;
        }
      } catch {}
    }
  }

  if (!raw) {
    try {
      raw = machineIdSync(true).trim().toLowerCase();
    } catch {}
  }

  if (!raw) {
    try {
      raw = machineIdSync().trim().toLowerCase();
    } catch {}
  }

  if (!raw) {
    raw = `${process.platform}-${process.arch}-${process.env.COMPUTERNAME || process.env.HOSTNAME || 'LAB-PC'}`.toLowerCase();
  }

  _cachedRawId = raw;
  return raw;
}

function hashToLabFormat(data: string): string {
  const hash = crypto.createHash('sha256').update(data + HWID_NAMESPACE_SECRET).digest('hex').toUpperCase();
  return `LAB-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

// 1. Get Clean Formatted Hardware ID (Cached in-memory)
export function getMachineHWID(): string {
  if (_cachedCanonicalHwid) return _cachedCanonicalHwid;
  const isBench = process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1';
  const t0 = isBench ? process.hrtime.bigint() : 0n;

  const persisted = loadPersistedHwidCache();
  if (persisted) {
    _cachedRawId = persisted.rawId;
    _cachedCanonicalHwid = persisted.hwid;
    _cachedLegacyHwid = persisted.legacyHwid;
    if (isBench) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(`⏱️ [BENCHMARK] فحص الترخيص (من كاش الختم الآمن): ${ms.toFixed(2)}ms`);
    }
    return _cachedCanonicalHwid;
  }

  const raw = getRawMachineId();
  _cachedCanonicalHwid = hashToLabFormat(raw);
  const legacy = hashToLabFormat(crypto.createHash('sha256').update(raw).digest('hex').toLowerCase());
  _cachedLegacyHwid = legacy;
  savePersistedHwidCache(raw, _cachedCanonicalHwid, legacy);

  if (isBench) {
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`⏱️ [BENCHMARK] فحص الترخيص (حساب أول مرة): ${ms.toFixed(2)}ms`);
  }
  return _cachedCanonicalHwid;
}

export function getLegacyHwid(): string {
  if (_cachedLegacyHwid) return _cachedLegacyHwid;
  const persisted = loadPersistedHwidCache();
  if (persisted) {
    _cachedRawId = persisted.rawId;
    _cachedCanonicalHwid = persisted.hwid;
    _cachedLegacyHwid = persisted.legacyHwid;
    return _cachedLegacyHwid;
  }
  const raw = getRawMachineId();
  const hashedRaw = crypto.createHash('sha256').update(raw).digest('hex').toLowerCase();
  _cachedLegacyHwid = hashToLabFormat(hashedRaw);
  return _cachedLegacyHwid;
}

export function isHardwareIdValidForMachine(hwidToCheck: string): boolean {
  if (!hwidToCheck) return false;
  const clean = hwidToCheck.trim().toUpperCase();
  return clean === getMachineHWID() || clean === getLegacyHwid();
}

function hardwareMatches(keyHwid: string, currentHwid: string): boolean {
  const cleanKeyHwid = keyHwid.trim().toUpperCase();
  const cleanCurrentHwid = (currentHwid || getMachineHWID()).trim().toUpperCase();
  return cleanKeyHwid === cleanCurrentHwid || isHardwareIdValidForMachine(cleanKeyHwid);
}

function checkExpiry(expiryStr: string): { ok: boolean; message: string; expiryDate?: Date } {
  const expiryDate = new Date(`${expiryStr}T23:59:59Z`);
  if (!Number.isFinite(expiryDate.getTime())) {
    return { ok: false, message: 'تاريخ انتهاء الترخيص غير صالح' };
  }
  if (new Date() > expiryDate) {
    return { ok: false, message: `انتهت صلاحية الاشتراك بتاريخ (${expiryStr})، يرجى التجديد` };
  }
  return { ok: true, message: 'ok', expiryDate };
}

function verifyLic2(
  license: string,
  currentHwid: string
): { valid: boolean; message: string; payload?: LicensePayload } {
  const rest = license.slice('LIC2-'.length);
  const dot = rest.lastIndexOf('.');
  if (dot <= 0) {
    return { valid: false, message: 'مفتاح الترخيص غير مكتمل أو تالف' };
  }

  const canonical = Buffer.from(rest.slice(0, dot), 'base64url').toString('utf-8');
  const signature = Buffer.from(rest.slice(dot + 1), 'base64url');
  const [version, keyHwid, expiryStr, tier, labName, issuedAt] = canonical.split('|');

  if (version !== 'v2' || !keyHwid || !expiryStr || !tier) {
    return { valid: false, message: 'بيانات مفتاح الترخيص تالفة أو غير صالحة' };
  }

  const publicKey = getLicensePublicKey();
  if (!publicKey) {
    return { valid: false, message: 'مفتاح التحقق العام غير مهيأ على هذا النظام' };
  }

  let signatureValid = false;
  try {
    signatureValid = crypto.verify(
      null,
      Buffer.from(canonical, 'utf-8'),
      publicKey,
      signature
    );
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return { valid: false, message: 'مفتاح الترخيص مزور أو تم التعديل عليه' };
  }

  if (!hardwareMatches(keyHwid, currentHwid)) {
    return { valid: false, message: `مفتاح الترخيص غير مطابق لهذا الجهاز (${(currentHwid || getMachineHWID()).trim().toUpperCase()})` };
  }

  const expiry = checkExpiry(expiryStr);
  if (!expiry.ok || !expiry.expiryDate) {
    return { valid: false, message: expiry.message };
  }

  return {
    valid: true,
    message: 'الترخيص صالح ومعتمد',
    payload: {
      hwid: keyHwid,
      expiryDate: expiry.expiryDate.toISOString(),
      tier: tier as any,
      labName,
      issuedAt,
    },
  };
}

function verifyLegacyLic(
  license: string,
  currentHwid: string
): { valid: boolean; message: string; payload?: LicensePayload } {
  if (!legacyLicensesAllowed()) {
    return {
      valid: false,
      message: 'التراخيص القديمة (LIC-) معطلة. يرجى طلب مفتاح ترخيص جديد بصيغة LIC2-.',
    };
  }

  const secret = getLegacyLicenseSecret();
  if (!secret) {
    return {
      valid: false,
      message: 'التحقق من التراخيص القديمة غير مهيأ على هذا النظام. يرجى طلب مفتاح ترخيص جديد بصيغة LIC2-.',
    };
  }

  const parts = license.replace(/^LIC-/, '').split('-');
  if (parts.length < 2) {
    return { valid: false, message: 'مفتاح الترخيص غير مكتمل' };
  }

  const signature = parts[parts.length - 1].toUpperCase();
  const base64Data = parts.slice(0, parts.length - 1).join('-');
  const decodedStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
  const [keyHwid, expiryStr, tier, labName] = decodedStr.split('|');

  if (!keyHwid || !expiryStr || !tier) {
    return { valid: false, message: 'بيانات مفتاح الترخيص تالفة أو غير صالحة' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(decodedStr)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  if (!safeEqualText(signature, expectedSignature)) {
    return { valid: false, message: 'مفتاح الترخيص مزور أو تم التعديل عليه' };
  }

  if (!hardwareMatches(keyHwid, currentHwid)) {
    return { valid: false, message: `مفتاح الترخيص غير مطابق لهذا الجهاز (${(currentHwid || getMachineHWID()).trim().toUpperCase()})` };
  }

  const expiry = checkExpiry(expiryStr);
  if (!expiry.ok || !expiry.expiryDate) {
    return { valid: false, message: expiry.message };
  }

  return {
    valid: true,
    message: 'الترخيص القديم صالح. يرجى ترقيته إلى صيغة LIC2- في أقرب وقت.',
    payload: {
      hwid: keyHwid,
      expiryDate: expiry.expiryDate.toISOString(),
      tier: tier as any,
      labName,
    },
  };
}

/**
 * @deprecated Server-side key generation is disabled by design.
 * Issue licenses with `node scripts/license-keygen.mjs sign`.
 */
export function generateLicenseKey(hwid: string, daysValid: number, tier: 'MONTHLY' | 'YEARLY' | 'LIFETIME' = 'MONTHLY', labName = 'مختبر طبي معتمد'): string {
  const secret = getLegacyLicenseSecret();
  if (!legacyLicensesAllowed() || !secret) {
    throw new Error(
      'Server-side license generation is disabled. Use scripts/license-keygen.mjs with the Ed25519 private key.'
    );
  }

  const cleanHwid = hwid.trim().toUpperCase();
  const expiryDate = tier === 'LIFETIME'
    ? new Date('2099-12-31T23:59:59Z')
    : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `${cleanHwid}|${expiryStr}|${tier}|${labName}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const base64Data = Buffer.from(dataToSign).toString('base64url');
  return `LIC-${base64Data}-${signature}`;
}

// 3. Verify License Key Offline (LIC2- Ed25519, legacy LIC- behind an explicit flag)
export function verifyLicenseKey(licenseKey: string, currentHwid: string): { valid: boolean; message: string; payload?: LicensePayload } {
  try {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return { valid: false, message: 'يرجى إدخال مفتاح الترخيص' };
    }

    const trimmed = licenseKey.trim();
    if (trimmed.startsWith('LIC2-')) {
      return verifyLic2(trimmed, currentHwid);
    }
    if (trimmed.startsWith('LIC-')) {
      return verifyLegacyLic(trimmed, currentHwid);
    }

    return { valid: false, message: 'صيغة مفتاح الترخيص غير صحيحة (يجب أن تبدأ بـ LIC2- أو LIC-)' };
  } catch {
    return { valid: false, message: 'فشل التحقق من مفتاح الترخيص' };
  }
}

// 4. Anti-Time-Tampering Check against SQLite DB
export async function verifySystemClockTampering(): Promise<boolean> {
  try {
    const latestSample = await prisma.sample.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (latestSample && latestSample.createdAt) {
      const now = new Date();
      // If system clock is set before the latest registered sample (tolerance: 10 mins)
      if (now.getTime() < latestSample.createdAt.getTime() - 10 * 60 * 1000) {
        return true; // Clock was tampered with!
      }
    }
    return false;
  } catch {
    return false;
  }
}

// 5. Get or Initialize 2-Day Free Trial
export async function getOrInitTrial(hwid: string): Promise<{ isTrial: boolean; daysLeft: number; expiryDate: string; isExpired: boolean }> {
  const cleanHwid = (hwid || getMachineHWID()).trim().toUpperCase();

  // Trials are bound to the machine HWID. Never reuse a trial created on another machine.
  let trialRecord = await prisma.license.findFirst({
    where: { tier: 'TRIAL', hardwareId: cleanHwid },
    orderBy: { expiryDate: 'desc' },
  });

  if (!trialRecord) {
    // Initialize 2-Day Free Trial (48 Hours)
    const trialExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    trialRecord = await prisma.license.create({
      data: {
        hardwareId: cleanHwid,
        signature: 'INITIAL_2_DAYS_FREE_TRIAL',
        expiryDate: trialExpiry,
        tier: 'TRIAL',
      },
    });
  }

  const now = new Date();
  const expiry = new Date(trialRecord.expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = now > expiry;

  return {
    isTrial: true,
    daysLeft,
    expiryDate: trialRecord.expiryDate.toISOString(),
    isExpired,
  };
}
