import { NextResponse } from 'next/server';
import { getMachineHWID, verifyLicenseKey } from '../../../../lib/licensing';
import { updateLicenseStore } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const licenseKey = body?.licenseKey?.trim() || '';

    if (!licenseKey) {
      return NextResponse.json({ message: 'يرجى إدخال كود التفعيل المستلم من الأدمن' }, { status: 400 });
    }

    const currentHwid = getMachineHWID();
    const verification = verifyLicenseKey(licenseKey, currentHwid);

    if (!verification.valid || !verification.payload) {
      return NextResponse.json({ message: verification.message }, { status: 400 });
    }

    // Save activated license to persistent store
    const saved = updateLicenseStore({
      isActivated: true,
      hardwareId: currentHwid,
      licenseKey,
      tier: verification.payload.tier,
      expiryDate: verification.payload.expiryDate,
      labName: verification.payload.labName,
      activatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل ترخيص البرنامج بنجاح! شكراً لاختياركم نظام لابريو الطبي.',
      hardwareId: currentHwid,
      tier: saved.tier,
      expiryDate: saved.expiryDate,
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل تفعيل الترخيص: ' + (err?.message || 'خطأ غير معروف') }, { status: 500 });
  }
}
