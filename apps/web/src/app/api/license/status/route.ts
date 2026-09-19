import { NextResponse } from 'next/server';
import { getMachineHWID, verifyLicenseKey } from '../../../../lib/licensing';
import { getLicenseStore, updateLicenseStore } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hwid = getMachineHWID();
    const license = getLicenseStore();

    const DEVELOPER_PHONE = '07764271130';
    const DEVELOPER_WHATSAPP = '9647764271130';
    const TRIAL_DAYS = 7;

    // Case 1: If already activated with a licenseKey, verify the license key
    if (license && license.isActivated && license.licenseKey) {
      const verification = verifyLicenseKey(license.licenseKey, hwid);

      if (verification.valid && verification.payload) {
        // Valid active license for THIS machine!
        const expiryDate = new Date(verification.payload.expiryDate);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const isExpired = now > expiryDate;

        return NextResponse.json({
          status: isExpired ? 'EXPIRED' : 'ACTIVE',
          hardwareId: hwid,
          isLicensed: !isExpired,
          isTrial: verification.payload.tier === 'TRIAL',
          isExpired,
          isClockTampered: false,
          tier: verification.payload.tier,
          daysLeft,
          expiryDate: verification.payload.expiryDate,
          labName: verification.payload.labName,
          developerPhone: DEVELOPER_PHONE,
          developerWhatsApp: DEVELOPER_WHATSAPP,
          message: verification.payload.tier === 'LIFETIME'
            ? 'نسخة مرخصة دائمية مدى الحياة (LIFETIME)'
            : (isExpired ? 'انتهت صلاحية الترخيص، يرجى التجديد' : `الاشتراك نشط ومفعل (متبقي ${daysLeft} يوماً)`),
        });
      }

      // If license key was from a different machine (e.g. copied from developer machine in template)
      if (verification.message && verification.message.includes('خاص بجهاز آخر')) {
        console.log('[License] Detected foreign machine HWID in seed data. Resetting to initialize local 7-day trial for:', hwid);
        updateLicenseStore({
          isActivated: false,
          licenseKey: undefined,
          hardwareId: hwid,
          firstRunDate: undefined,
          trialExpiresAt: undefined,
          lastClockCheck: undefined,
        });
        // Proceed to Case 2 below
      } else {
        // Genuine invalid key
        return NextResponse.json({
          status: 'INVALID',
          hardwareId: hwid,
          isLicensed: false,
          isTrial: false,
          isExpired: true,
          isClockTampered: false,
          developerPhone: DEVELOPER_PHONE,
          developerWhatsApp: DEVELOPER_WHATSAPP,
          message: verification.message || 'مفتاح الترخيص غير صالح.',
        });
      }
    }

    // Case 2: Not activated yet -> Auto-initialize 7-Day Free Trial
    const currentLicense = getLicenseStore();
    const now = new Date();
    let trialFirstRun = currentLicense?.firstRunDate;
    let trialExpiresAt = currentLicense?.trialExpiresAt;
    let lastClock = currentLicense?.lastClockCheck ? new Date(currentLicense.lastClockCheck) : null;

    // First time setup on clean installation
    if (!trialFirstRun || !trialExpiresAt) {
      trialFirstRun = now.toISOString();
      const exp = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      trialExpiresAt = exp.toISOString();
      updateLicenseStore({
        hardwareId: hwid,
        isActivated: false,
        firstRunDate: trialFirstRun,
        trialExpiresAt: trialExpiresAt,
        lastClockCheck: now.toISOString(),
      });
    }

    // Clock tampering protection: detect if system time was rolled back more than 2 hours
    let isClockTampered = false;
    if (lastClock && now.getTime() < (lastClock.getTime() - 2 * 60 * 60 * 1000)) {
      isClockTampered = true;
    } else {
      updateLicenseStore({
        lastClockCheck: now.toISOString(),
      });
    }

    const trialExpDate = new Date(trialExpiresAt);
    const trialDiffMs = trialExpDate.getTime() - now.getTime();
    const trialDaysLeft = Math.max(0, Math.ceil(trialDiffMs / (1000 * 60 * 60 * 24)));
    const isTrialExpired = now > trialExpDate || trialDiffMs <= 0;

    if (isClockTampered) {
      return NextResponse.json({
        status: 'CLOCK_TAMPERED',
        hardwareId: hwid,
        isLicensed: false,
        isTrial: true,
        isExpired: true,
        isClockTampered: true,
        daysLeft: 0,
        expiryDate: trialExpiresAt,
        developerPhone: DEVELOPER_PHONE,
        developerWhatsApp: DEVELOPER_WHATSAPP,
        message: 'تم رصد تلاعب في تاريخ ووقت النظام. يرجى ضبط الساعة بشكل دقيق أو التواصل مع المطور لتفعيل نسختك.',
      });
    }

    if (isTrialExpired) {
      return NextResponse.json({
        status: 'EXPIRED',
        hardwareId: hwid,
        isLicensed: false,
        isTrial: true,
        isExpired: true,
        isClockTampered: false,
        daysLeft: 0,
        expiryDate: trialExpiresAt,
        developerPhone: DEVELOPER_PHONE,
        developerWhatsApp: DEVELOPER_WHATSAPP,
        message: 'انتهت الفترة التجريبية المجانية (7 أيام). يرجى إرسال كود بصمة الجهاز إلى المطور لتفعيل البرنامج بشكل دائم.',
      });
    }

    // Trial is ACTIVE! Normal operation allowed for 7 days
    return NextResponse.json({
      status: 'TRIAL',
      hardwareId: hwid,
      isLicensed: true,
      isTrial: true,
      isExpired: false,
      isClockTampered: false,
      tier: 'TRIAL',
      daysLeft: trialDaysLeft,
      expiryDate: trialExpiresAt,
      developerPhone: DEVELOPER_PHONE,
      developerWhatsApp: DEVELOPER_WHATSAPP,
      message: `فترة تجريبية مجانية (متبقي ${trialDaysLeft} ${trialDaysLeft === 1 ? 'يوم واحد' : 'أيام'})`,
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
