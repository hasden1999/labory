import { NextResponse } from 'next/server';
import crypto from 'crypto';

const MASTER_SECRET = 'LAB_MANAGER_OFFLINE_SECRET_KEY_v2026_HMAC_SECURE_981247';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hwid, tier = 'LIFETIME', daysValid = 36500, labName = 'مختبر طبي معتمد' } = body;

    if (!hwid || !hwid.trim()) {
      return NextResponse.json({ message: 'كود بصمة الجهاز مطلوب' }, { status: 400 });
    }

    const cleanHwid = hwid.trim().toUpperCase();
    let expiryDate: Date;
    if (tier === 'LIFETIME') {
      expiryDate = new Date('2099-12-31T23:59:59Z');
    } else if (tier === 'YEARLY') {
      expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } else if (tier === 'MONTHLY') {
      expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      expiryDate = new Date(Date.now() + (parseInt(daysValid, 10) || 30) * 24 * 60 * 60 * 1000);
    }

    const expiryStr = expiryDate.toISOString().split('T')[0];
    const dataToSign = cleanHwid + '|' + expiryStr + '|' + tier + '|' + labName;

    const signature = crypto
      .createHmac('sha256', MASTER_SECRET)
      .update(dataToSign)
      .digest('hex')
      .substring(0, 10)
      .toUpperCase();

    const base64Data = Buffer.from(dataToSign).toString('base64url');
    const licenseKey = 'LIC-' + base64Data + '-' + signature;

    return NextResponse.json({
      success: true,
      licenseKey,
      hwid: cleanHwid,
      tier,
      expiryDate: expiryStr,
      labName,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل توليد المفتاح' }, { status: 500 });
  }
}