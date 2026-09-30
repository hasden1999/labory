import crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';
import { prisma } from '../prisma';

// Master Secret for HMAC signatures (Private to system)
const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

export interface LicensePayload {
  hwid: string;
  expiryDate: string; // ISO String
  tier: 'TWO_DAYS' | 'WEEKLY' | 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;
  labName?: string;
}

import { execSync } from 'child_process';

let _cachedRawId: string | null = null;
let _cachedCanonicalHwid: string | null = null;
let _cachedLegacyHwid: string | null = null;

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
  const hash = crypto.createHash('sha256').update(data + MASTER_SECRET).digest('hex').toUpperCase();
  return `LAB-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

// 1. Get Clean Formatted Hardware ID (Cached in-memory)
export function getMachineHWID(): string {
  if (_cachedCanonicalHwid) return _cachedCanonicalHwid;
  _cachedCanonicalHwid = hashToLabFormat(getRawMachineId());
  return _cachedCanonicalHwid;
}

export function getLegacyHwid(): string {
  if (_cachedLegacyHwid) return _cachedLegacyHwid;
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

// 2. Developer Keygen: Generate Signed Offline License Key
export function generateLicenseKey(hwid: string, daysValid: number, tier: 'MONTHLY' | 'YEARLY' | 'LIFETIME' = 'MONTHLY', labName = 'مختبر طبي معتمد'): string {
  const cleanHwid = hwid.trim().toUpperCase();
  const expiryDate = tier === 'LIFETIME' 
    ? new Date('2099-12-31T23:59:59Z') 
    : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
  
  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `${cleanHwid}|${expiryStr}|${tier}|${labName}`;
  
  const signature = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataToSign)
    .digest('hex')
    .substring(0, 10)
    .toUpperCase();

  const base64Data = Buffer.from(dataToSign).toString('base64url');
  return `LIC-${base64Data}-${signature}`;
}

// 3. Verify License Key Offline
export function verifyLicenseKey(licenseKey: string, currentHwid: string): { valid: boolean; message: string; payload?: LicensePayload } {
  try {
    if (!licenseKey || !licenseKey.startsWith('LIC-')) {
      return { valid: false, message: 'صيغة مفتاح الترخيص غير صحيحة' };
    }

    const parts = licenseKey.replace('LIC-', '').split('-');
    if (parts.length < 2) {
      return { valid: false, message: 'مفتاح الترخيص غير مكتمل' };
    }

    const signature = parts[parts.length - 1];
    const base64Data = parts.slice(0, parts.length - 1).join('-');
    const decodedStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
    const [keyHwid, expiryStr, tier, labName] = decodedStr.split('|');

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

    // Verify HWID Match
    const cleanKeyHwid = keyHwid.trim().toUpperCase();
    const cleanCurrentHwid = (currentHwid || getMachineHWID()).trim().toUpperCase();
    if (cleanKeyHwid !== cleanCurrentHwid && !isHardwareIdValidForMachine(cleanKeyHwid)) {
      return { valid: false, message: `مفتاح الترخيص غير مطابق لهذا الجهاز (${cleanCurrentHwid})` };
    }

    // Verify Expiry Date
    const expiryDate = new Date(`${expiryStr}T23:59:59Z`);
    const now = new Date();
    if (now > expiryDate) {
      return { valid: false, message: `انتهت صلاحية الاشتراك بتاريخ (${expiryStr})، يرجى التجديد` };
    }

    return {
      valid: true,
      message: 'الترخيص صالح ومعتمد',
      payload: {
        hwid: keyHwid,
        expiryDate: expiryDate.toISOString(),
        tier: tier as any,
        labName,
      },
    };
  } catch (err: any) {
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
  let trialRecord = await prisma.license.findFirst({
    where: { tier: 'TRIAL' },
  });

  if (!trialRecord) {
    // Initialize 2-Day Free Trial (48 Hours)
    const trialExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    trialRecord = await prisma.license.create({
      data: {
        hardwareId: hwid,
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
