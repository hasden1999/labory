import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

declare const __non_webpack_require__: any;

/**
 * Offline licensing.
 *
 * New format: LIC2-<base64url(canonical payload)>.<base64url(Ed25519 signature)>
 * Canonical payload: v2|HWID|YYYY-MM-DD|TIER|LAB_NAME|ISSUED_AT
 *
 * The Ed25519 private key never ships with the client. Only the public key is embedded
 * here (and can be overridden with LABRYO_LICENSE_PUBLIC_KEY as base64 SPKI DER or PEM).
 *
 * Legacy LIC- (HMAC) keys are accepted only while LABRYO_ALLOW_LEGACY_LICENSES=1 and
 * LABRYO_LEGACY_LICENSE_SECRET is configured. This is a temporary migration window;
 * every customer license should be reissued as LIC2- with scripts/license-keygen.mjs.
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

function getTamperSealSecret(): string {
  // Keep the historical namespace as the default so existing local seals remain valid
  // after the upgrade. Rotating LABRYO_TAMPER_SEAL_SECRET invalidates every stored seal,
  // so rotate it only together with a deliberate re-seal/migration step.
  return process.env.LABRYO_TAMPER_SEAL_SECRET || HWID_NAMESPACE_SECRET;
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export interface LicensePayload {
  hwid: string;
  expiryDate: string; // ISO String: YYYY-MM-DD
  tier: 'TWO_DAYS' | 'WEEKLY' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;
  labName?: string;
  issuedAt?: string;
}

// Memory caches for zero-latency, rock-solid consistency across the entire app lifecycle
let _cachedRawId: string | null = null;
let _cachedCanonicalHwid: string | null = null;
let _cachedLegacyHwid: string | null = null;

function getHwidCachePath(): string | null {
  try {
    const dir = process.env.LABRYO_DATA_DIR
      ? path.resolve(process.env.LABRYO_DATA_DIR)
      : (process.env.VERCEL
          ? path.join('/tmp', 'labryo_data')
          : path.resolve(process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps', 'web'), 'data'));
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

export function getRawMachineId(): string {
  if (_cachedRawId) return _cachedRawId;

  let raw = '';

  // Attempt 1: Windows Registry MachineGuid (via reg.exe with absolute paths & 6s timeout)
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
      } catch {
        // Continue to next candidate
      }
    }
  }

  // Attempt 2: node-machine-id with original: true (returns raw MachineGuid on Windows)
  if (!raw) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
      const { machineIdSync } = req('node-machine-id');
      if (typeof machineIdSync === 'function') {
        const id = machineIdSync(true);
        if (id && typeof id === 'string') {
          raw = id.trim().toLowerCase();
        }
      }
    } catch {
      // Fallback
    }
  }

  // Attempt 3: node-machine-id without arguments (if only hashed version succeeds)
  if (!raw) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
      const { machineIdSync } = req('node-machine-id');
      if (typeof machineIdSync === 'function') {
        const id = machineIdSync();
        if (id && typeof id === 'string') {
          raw = id.trim().toLowerCase();
        }
      }
    } catch {
      // Fallback
    }
  }

  // Attempt 4: OS Network / Platform fallback
  if (!raw) {
    raw = `${process.platform}-${process.arch}-${process.env.COMPUTERNAME || process.env.HOSTNAME || 'LAB-PC'}`.toLowerCase();
  }

  _cachedRawId = raw;
  return raw;
}

function hashToLabFormat(data: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(data + HWID_NAMESPACE_SECRET)
    .digest('hex')
    .toUpperCase();

  return `LAB-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

// 1. Get Clean Formatted Hardware ID (Cached in-memory, zero event-loop lag)
export function getMachineHWID(): string {
  if (_cachedCanonicalHwid) return _cachedCanonicalHwid;
  const isBench = process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1';
  const t0 = isBench ? process.hrtime.bigint() : BigInt(0);

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

// Legacy HWID: derived when node-machine-id was hashed with sha256 before HMAC
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

// Verify if a hardware ID belongs to this computer (matches either canonical or legacy)
export function isHardwareIdValidForMachine(hwidToCheck: string): boolean {
  if (!hwidToCheck) return false;
  const clean = hwidToCheck.trim().toUpperCase();
  const canonical = getMachineHWID();
  const legacy = getLegacyHwid();
  return clean === canonical || clean === legacy;
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
    return {
      ok: false,
      message: `انتهت صلاحية هذا الترخيص بتاريخ (${expiryStr})، يرجى التجديد`,
    };
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
    return {
      valid: false,
      message: `مفتاح الترخيص خاص بجهاز آخر (${keyHwid.trim().toUpperCase()}) وغير مطابق لهذا الجهاز (${(currentHwid || getMachineHWID()).trim().toUpperCase()})`,
    };
  }

  const expiry = checkExpiry(expiryStr);
  if (!expiry.ok || !expiry.expiryDate) {
    return { valid: false, message: expiry.message };
  }

  return {
    valid: true,
    message: 'تم التحقق من مفتاح الترخيص بنجاح وهو صالح ومعتمد',
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
    return { valid: false, message: 'مفتاح الترخيص غير مكتمل أو ناقص' };
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
    return {
      valid: false,
      message: `مفتاح الترخيص خاص بجهاز آخر (${keyHwid.trim().toUpperCase()}) وغير مطابق لهذا الجهاز (${(currentHwid || getMachineHWID()).trim().toUpperCase()})`,
    };
  }

  const expiry = checkExpiry(expiryStr);
  if (!expiry.ok || !expiry.expiryDate) {
    return { valid: false, message: expiry.message };
  }

  return {
    valid: true,
    message: 'تم التحقق من مفتاح الترخيص القديم بنجاح. يرجى ترقيته إلى صيغة LIC2- في أقرب وقت.',
    payload: {
      hwid: keyHwid,
      expiryDate: expiry.expiryDate.toISOString(),
      tier: tier as any,
      labName,
    },
  };
}

/**
 * @deprecated Client-side key generation is disabled by design.
 * Issue real licenses with `node scripts/license-keygen.mjs sign` (Ed25519 private key
 * stays outside the repository and outside the client bundle).
 *
 * Legacy HMAC generation survives only for the migration window and requires both
 * LABRYO_ALLOW_LEGACY_LICENSES=1 and LABRYO_LEGACY_LICENSE_SECRET.
 */
export function generateLicenseKey(
  hwid: string,
  daysValid: number,
  tier: 'TWO_DAYS' | 'WEEKLY' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string = 'LIFETIME',
  labName = 'مختبر معتمد'
): string {
  const secret = getLegacyLicenseSecret();
  if (!legacyLicensesAllowed() || !secret) {
    throw new Error(
      'Client-side license generation is disabled. Use scripts/license-keygen.mjs with the Ed25519 private key.'
    );
  }

  const cleanHwid = hwid.trim().toUpperCase();
  const expiryDate = tier === 'LIFETIME'
    ? new Date('2099-12-31T23:59:59Z')
    : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `${cleanHwid}|${expiryStr}|${tier}|${labName.trim()}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const base64Data = Buffer.from(dataToSign, 'utf-8').toString('base64url');
  return `LIC-${base64Data}-${signature}`;
}

// 3. Verify License Key Offline (LIC2- Ed25519, legacy LIC- behind an explicit flag)
export function verifyLicenseKey(
  licenseKey: string,
  currentHwid: string
): { valid: boolean; message: string; payload?: LicensePayload } {
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

    return {
      valid: false,
      message: 'صيغة مفتاح الترخيص غير صحيحة (يجب أن تبدأ بـ LIC2- أو LIC-)',
    };
  } catch (err: any) {
    return { valid: false, message: 'فشل التحقق من مفتاح الترخيص: ' + (err?.message || 'خطأ غير معروف') };
  }
}

// 4. Anti-Tamper Cryptographic Seal for local store (prevents editing lab_store.json)
export function createLicenseTamperSeal(params: {
  hardwareId: string;
  firstRunDate?: string;
  trialExpiresAt?: string;
  maxMonotonicTime?: string;
  isActivated: boolean;
  licenseKey?: string;
  tier?: string;
}): string {
  const payload = [
    params.hardwareId || '',
    params.firstRunDate || '',
    params.trialExpiresAt || '',
    params.maxMonotonicTime || '',
    params.isActivated ? 'ACTIVE' : 'INACTIVE',
    params.licenseKey || '',
    params.tier || '',
  ].join('##');

  return crypto
    .createHmac('sha256', getTamperSealSecret())
    .update(payload)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

export function verifyLicenseTamperSeal(
  params: {
    hardwareId: string;
    firstRunDate?: string;
    trialExpiresAt?: string;
    maxMonotonicTime?: string;
    isActivated: boolean;
    licenseKey?: string;
    tier?: string;
  },
  seal?: string
): boolean {
  if (!seal || typeof seal !== 'string') return false;
  const expected = createLicenseTamperSeal(params);
  return seal.toUpperCase() === expected;
}
