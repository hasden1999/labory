import crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';
import { prisma } from '../prisma';

// Master Secret for HMAC signatures (Private to system)
const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

export interface LicensePayload {
  hwid: string;
  expiryDate: string; // ISO String
  tier: 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  labName?: string;
}

// 1. Get Clean Formatted Hardware ID
export function getMachineHWID(): string {
  try {
    const raw = machineIdSync();
    const hash = crypto.createHash('sha256').update(raw + MASTER_SECRET).digest('hex').toUpperCase();
    return `LAB-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
  } catch (err) {
    const fallback = crypto.createHash('sha256').update(process.platform + MASTER_SECRET).digest('hex').toUpperCase();
    return `LAB-FLBK-${fallback.substring(0, 4)}-${fallback.substring(4, 8)}`;
  }
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
    if (keyHwid !== currentHwid.trim().toUpperCase()) {
      return { valid: false, message: 'مفتاح الترخيص غير مطابق لهذا الجهاز' };
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

// 5. Get or Initialize 7-Day Free Trial
export async function getOrInitTrial(hwid: string): Promise<{ isTrial: boolean; daysLeft: number; expiryDate: string; isExpired: boolean }> {
  let trialRecord = await prisma.license.findFirst({
    where: { tier: 'TRIAL' },
  });

  if (!trialRecord) {
    // Initialize 7-Day Free Trial
    const trialExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    trialRecord = await prisma.license.create({
      data: {
        hardwareId: hwid,
        signature: 'INITIAL_7_DAYS_FREE_TRIAL',
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
