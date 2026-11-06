import { NextResponse } from 'next/server';
import { getMachineHWID, verifyLicenseKey, createLicenseTamperSeal } from '../../../../lib/licensing';
import { updateLicenseStore } from '../../../../lib/serverStore';
import { prisma } from '../../../../lib/prisma';

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

    const nowIso = new Date().toISOString();
    const seal = createLicenseTamperSeal({
      hardwareId: currentHwid,
      isActivated: true,
      licenseKey,
      tier: verification.payload.tier,
      trialExpiresAt: verification.payload.expiryDate,
      maxMonotonicTime: nowIso,
    });

    // Save activated license to persistent store
    const saved = updateLicenseStore({
      isActivated: true,
      hardwareId: currentHwid,
      licenseKey,
      tier: verification.payload.tier,
      expiryDate: verification.payload.expiryDate,
      labName: verification.payload.labName,
      activatedAt: nowIso,
      maxMonotonicTime: nowIso,
      tamperSeal: seal,
      isTampered: false,
      isClockTampered: false,
    });

    // Mirror to SQLite if available
    try {
      if (prisma && prisma.license) {
        await prisma.license.create({
          data: {
            hardwareId: currentHwid,
            signature: licenseKey,
            expiryDate: new Date(verification.payload.expiryDate),
            tier: String(verification.payload.tier),
          },
        });
      }
    } catch {
      // Ignored if duplicate or non-fatal
    }

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
