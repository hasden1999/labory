import crypto from 'crypto';
import { execSync } from 'child_process';

// Master Secret for HMAC signatures (Private to system)
export const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

export interface LicensePayload {
  hwid: string;
  expiryDate: string; // ISO String: YYYY-MM-DD
  tier: 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  labName?: string;
}

// 1. Get Clean Formatted Hardware ID (Multi-layered fallback)
export function getMachineHWID(): string {
  let rawId = '';

  // Attempt 1: Windows Registry MachineGuid (Very stable across reboots)
  if (process.platform === 'win32') {
    try {
      const out = execSync('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', {
        timeout: 2000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
      const match = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
      if (match && match[1]) {
        rawId = match[1].trim();
      }
    } catch {
      // Fallback
    }
  }

  // Attempt 2: node-machine-id
  if (!rawId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { machineIdSync } = require('node-machine-id');
      rawId = machineIdSync();
    } catch {
      // Fallback
    }
  }

  // Attempt 3: OS Network / Platform fallback
  if (!rawId) {
    rawId = `${process.platform}-${process.arch}-${process.env.COMPUTERNAME || process.env.HOSTNAME || 'LAB-PC'}`;
  }

  const hash = crypto
    .createHash('sha256')
    .update(rawId + MASTER_SECRET)
    .digest('hex')
    .toUpperCase();

  return `LAB-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

// 2. Developer / Admin Keygen: Generate Signed Offline License Key
export function generateLicenseKey(
  hwid: string,
  daysValid: number,
  tier: 'MONTHLY' | 'YEARLY' | 'LIFETIME' = 'LIFETIME',
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

    // Verify HWID Match
    if (keyHwid.trim().toUpperCase() !== currentHwid.trim().toUpperCase()) {
      return {
        valid: false,
        message: `مفتاح الترخيص خاص بجهاز آخر (${keyHwid}) وغير مطابق لهذا الجهاز (${currentHwid})`,
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
