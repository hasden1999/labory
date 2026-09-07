import { NextResponse } from 'next/server';
import { getMachineHWID, verifyLicenseKey } from '../../../../lib/licensing';
import { getLicenseStore } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hwid = getMachineHWID();
    const license = getLicenseStore();

    const DEVELOPER_PHONE = '07764271130';
    const DEVELOPER_WHATSAPP = '9647764271130';

    if (!license || !license.isActivated || !license.licenseKey) {
      return NextResponse.json({
        status: 'UNLICENSED',
        hardwareId: hwid,
        isLicensed: false,
        isTrial: false,
        isExpired: false,
        isClockTampered: false,
        developerPhone: DEVELOPER_PHONE,
        developerWhatsApp: DEVELOPER_WHATSAPP,
        message: 'البرنامج غير مفعل بعد. يرجى إرسال كود بصمة الجهاز إلى الأدمن لتفعيل نسختك.',
      });
    }

    // Verify stored license with current machine HWID
    const verification = verifyLicenseKey(license.licenseKey, hwid);

    if (!verification.valid || !verification.payload) {
      return NextResponse.json({
        status: 'INVALID',
        hardwareId: hwid,
        isLicensed: false,
        isTrial: false,
        isExpired: true,
        isClockTampered: false,
        developerPhone: DEVELOPER_PHONE,
        developerWhatsApp: DEVELOPER_WHATSAPP,
        message: verification.message || 'مفتاح الترخيص غير صالح أو غير مطابق لهذا الجهاز.',
      });
    }

    const expiryDate = new Date(verification.payload.expiryDate);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      status: 'ACTIVE',
      hardwareId: hwid,
      isLicensed: true,
      isTrial: verification.payload.tier === 'TRIAL',
      isExpired: false,
      isClockTampered: false,
      tier: verification.payload.tier,
      daysLeft,
      expiryDate: verification.payload.expiryDate,
      labName: verification.payload.labName,
      developerPhone: DEVELOPER_PHONE,
      developerWhatsApp: DEVELOPER_WHATSAPP,
      message: verification.payload.tier === 'LIFETIME'
        ? 'نسخة مرخصة دائمية مدى الحياة (LIFETIME)'
        : `الاشتراك نشط ومفعل (متبقي ${daysLeft} يوماً)`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'ERROR',
        hardwareId: 'LAB-ERROR-READING-HWID',
        isLicensed: false,
        message: 'حدث خطأ في فحص ترخيص النظام: ' + (err?.message || ''),
      },
      { status: 500 }
    );
  }
}
