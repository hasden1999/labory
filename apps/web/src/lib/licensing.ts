import crypto from 'crypto';
import { execSync } from 'child_process';

declare const __non_webpack_require__: any;

/**
 * Master Secret for HMAC signatures
 * In production or remote deployments, this should be overridden via process.env.LABRYO_LICENSE_SECRET.
 * Architectural note: As part of the security roadmap (SEC-001 / SEC-002), symmetric HMAC licensing
 * is planned for migration to Ed25519 asymmetric signatures (where client bundles only embed the public key).
 */
export const MASTER_SECRET = process.env.LABRYO_LICENSE_SECRET || 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

export interface LicensePayload {
  hwid: string;
  expiryDate: string; // ISO String: YYYY-MM-DD
  tier: 'TWO_DAYS' | 'WEEKLY' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;
  labName?: string;
}

// Memory caches for zero-latency, rock-solid consistency across the entire app lifecycle
let _cachedRawId: string | null = null;
let _cachedCanonicalHwid: string | null = null;
let _cachedLegacyHwid: string | null = null;

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
    .update(data + MASTER_SECRET)
    .digest('hex')
    .toUpperCase();

  return `LAB-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

// 1. Get Clean Formatted Hardware ID (Cached in-memory, zero event-loop lag)
export function getMachineHWID(): string {
  if (_cachedCanonicalHwid) return _cachedCanonicalHwid;
  const raw = getRawMachineId();
  _cachedCanonicalHwid = hashToLabFormat(raw);
  return _cachedCanonicalHwid;
}

// Legacy HWID: derived when node-machine-id was hashed with sha256 before HMAC
export function getLegacyHwid(): string {
  if (_cachedLegacyHwid) return _cachedLegacyHwid;
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

// 2. Developer / Admin Keygen: Generate Signed Offline License Key
export function generateLicenseKey(
  hwid: string,
  daysValid: number,
  tier: 'TWO_DAYS' | 'WEEKLY' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string = 'LIFETIME',
  labName = 'مختبر معتمد'
): string {
  const cleanHwid = hwid.trim().toUpperCase();
  const expiryDate = tier === 'LIFETIME'
    ? new Date('2099-12-31T23:59:59Z')
    : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `${cleanHwid}|${expiryStr}|${tier}|${labName.trim()}`;

  const signature = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const base64Data = Buffer.from(dataToSign, 'utf-8').toString('base64url');
  return `LIC-${base64Data}-${signature}`;
}

// 3. Verify License Key Offline
export function verifyLicenseKey(
  licenseKey: string,
  currentHwid: string
): { valid: boolean; message: string; payload?: LicensePayload } {
  try {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return { valid: false, message: 'يرجى إدخال مفتاح الترخيص' };
    }

    const trimmed = licenseKey.trim();
    if (!trimmed.startsWith('LIC-')) {
      return { valid: false, message: 'صيغة مفتاح الترخيص غير صحيحة (يجب أن تبدأ بـ LIC-)' };
    }

    const parts = trimmed.replace(/^LIC-/, '').split('-');
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

    // Verify HMAC Signature
    const expectedSignature = crypto
      .createHmac('sha256', MASTER_SECRET)
      .update(decodedStr)
      .digest('hex')
      .substring(0, 10)
      .toUpperCase();

    if (signature !== expectedSignature) {
      return { valid: false, message: 'مفتاح الترخيص مزور أو تم التعديل عليه' };
    }

    // Verify HWID Match (Checks canonical ID and legacy ID for 100% device compatibility)
    const cleanKeyHwid = keyHwid.trim().toUpperCase();
    const cleanCurrentHwid = (currentHwid || getMachineHWID()).trim().toUpperCase();
    const isMatched = cleanKeyHwid === cleanCurrentHwid || isHardwareIdValidForMachine(cleanKeyHwid);

    if (!isMatched) {
      return {
        valid: false,
        message: `مفتاح الترخيص خاص بجهاز آخر (${cleanKeyHwid}) وغير مطابق لهذا الجهاز (${cleanCurrentHwid})`,
      };
    }

    // Verify Expiry Date
    const expiryDate = new Date(`${expiryStr}T23:59:59Z`);
    const now = new Date();
    if (now > expiryDate) {
      return { valid: false, message: `انتهت صلاحية هذا الترخيص بتاريخ (${expiryStr})، يرجى التجديد` };
    }

    return {
      valid: true,
      message: 'تم التحقق من مفتاح الترخيص بنجاح وهو صالح ومعتمد',
      payload: {
        hwid: keyHwid,
        expiryDate: expiryDate.toISOString(),
        tier: tier as any,
        labName,
      },
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
    .createHmac('sha256', MASTER_SECRET)
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
