import { NextResponse } from 'next/server';
import { getMachineHWID, verifyLicenseKey, createLicenseTamperSeal, verifyLicenseTamperSeal } from '../../../../lib/licensing';
import { getLicenseStore, updateLicenseStore } from '../../../../lib/serverStore';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hwid = getMachineHWID();
    const license = getLicenseStore();

    const DEVELOPER_PHONE = '07764271130';
    const DEVELOPER_WHATSAPP = '9647764271130';
    const TRIAL_DAYS = 2; // Strict 2-day trial as requested

    const now = new Date();
    const nowMs = now.getTime();

    // -------------------------------------------------------------------------
    // 1. Monotonic Clock & Tamper Verification
    // -------------------------------------------------------------------------
    let maxHistoricalTimeMs = 0;

    // Check JSON store monotonic marker
    if (license?.maxMonotonicTime) {
      const parsed = new Date(license.maxMonotonicTime).getTime();
      if (!isNaN(parsed) && parsed > maxHistoricalTimeMs) {
        maxHistoricalTimeMs = parsed;
      }
    }
    if (license?.lastClockCheck) {
      const parsed = new Date(license.lastClockCheck).getTime();
      if (!isNaN(parsed) && parsed > maxHistoricalTimeMs) {
        maxHistoricalTimeMs = parsed;
      }
    }

    // Cross-verify with SQLite database (latest sample / patient / transaction)
    try {
      if (prisma && prisma.sample) {
        const latestSample = await prisma.sample.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        if (latestSample?.createdAt) {
          const sampleTimeMs = new Date(latestSample.createdAt).getTime();
          if (sampleTimeMs > maxHistoricalTimeMs) {
            maxHistoricalTimeMs = sampleTimeMs;
          }
        }
      }
    } catch {
      // Ignored if SQLite connection unavailable
    }

    // If system clock was rolled back more than 15 minutes before highest recorded time:
    let isClockTampered = false;
    if (maxHistoricalTimeMs > 0 && nowMs < (maxHistoricalTimeMs - 15 * 60 * 1000)) {
      isClockTampered = true;
    }

    if (isClockTampered) {
      return NextResponse.json({
        status: 'CLOCK_TAMPERED',
        hardwareId: hwid,
        isLicensed: false,
        isTrial: false,
        isExpired: true,
        isClockTampered: true,
        daysLeft: 0,
        developerPhone: DEVELOPER_PHONE,
        developerWhatsApp: DEVELOPER_WHATSAPP,
        message: 'تم اكتشاف تلاعب في ساعة النظام (تأخير التاريخ والوقت)! يرجى ضبط تاريخ ووقت الكمبيوتر بشكل دقيق لإعادة تنشيط البرنامج.',
      });
    }

    // -------------------------------------------------------------------------
    // 2. Case 1: Activated with Paid / Assigned License Key
    // -------------------------------------------------------------------------
    if (license && license.isActivated && license.licenseKey) {
      const verification = verifyLicenseKey(license.licenseKey, hwid);

      if (verification.valid && verification.payload) {
        const expiryDate = new Date(verification.payload.expiryDate);
        const diffMs = expiryDate.getTime() - nowMs;
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const isExpired = now > expiryDate || diffMs <= 0;

        // Advance monotonic timestamp
        const updatedMonotonic = nowMs > maxHistoricalTimeMs ? now.toISOString() : (license.maxMonotonicTime || now.toISOString());
        updateLicenseStore({
          lastClockCheck: now.toISOString(),
          maxMonotonicTime: updatedMonotonic,
        });

        let displayMessage = 'نسخة مرخصة ومدعومة رسمياً';
        const tier = verification.payload.tier;
        if (tier === 'LIFETIME') {
          displayMessage = 'نسخة مرخصة دائمية مدى الحياة (LIFETIME)';
        } else if (tier === 'TWO_DAYS') {
          displayMessage = isExpired 
            ? 'انتهت صلاحية باقة التفعيل ليومين، يرجى التجديد أو التفعيل الدائم' 
            : `الاشتراك نشط لمدة يومين (متبقي ${daysLeft} ${daysLeft === 1 ? 'يوم واحد' : 'يومين'})`;
        } else if (tier === 'WEEKLY') {
          displayMessage = isExpired 
            ? 'انتهت صلاحية باقة الأسبوع، يرجى التجديد أو التفعيل الدائم' 
            : `الاشتراك نشط لمدة أسبوع (متبقي ${daysLeft} أيام)`;
        } else {
          displayMessage = isExpired 
            ? `انتهت صلاحية الترخيص (${tier})، يرجى التجديد` 
            : `الاشتراك نشط ومفعل (متبقي ${daysLeft} يوماً)`;
        }

        return NextResponse.json({
          status: isExpired ? 'EXPIRED' : 'ACTIVE',
          hardwareId: hwid,
          isLicensed: !isExpired,
          isTrial: false,
          isExpired,
          isClockTampered: false,
          tier: verification.payload.tier,
          daysLeft,
          expiryDate: verification.payload.expiryDate,
          labName: verification.payload.labName,
          developerPhone: DEVELOPER_PHONE,
          developerWhatsApp: DEVELOPER_WHATSAPP,
          message: displayMessage,
        });
      }

      // Foreign machine HWID detected
      if (verification.message && verification.message.includes('خاص بجهاز آخر')) {
        console.log('[License] Detected foreign machine HWID. Resetting local store for:', hwid);
        updateLicenseStore({
          isActivated: false,
          licenseKey: undefined,
          hardwareId: hwid,
          firstRunDate: undefined,
          trialExpiresAt: undefined,
          lastClockCheck: undefined,
          tamperSeal: undefined,
        });
      } else {
        return NextResponse.json({
          status: 'INVALID',
          hardwareId: hwid,
          isLicensed: false,
          isTrial: false,
          isExpired: true,
          isClockTampered: false,
          developerPhone: DEVELOPER_PHONE,
          developerWhatsApp: DEVELOPER_WHATSAPP,
          message: verification.message || 'مفتاح الترخيص غير صالح أو غير معتمد لهذا الجهاز.',
        });
      }
    }

    // -------------------------------------------------------------------------
    // 3. Case 2: Free 2-Day Trial & Anti-Reset Inspection
    // -------------------------------------------------------------------------
    const currentLicense = getLicenseStore();
    let trialFirstRun = currentLicense?.firstRunDate;
    let trialExpiresAt = currentLicense?.trialExpiresAt;
    let trialFinished = !!currentLicense?.trialFinished;

    // Check File Integrity Seal if trial was previously initialized
    if (trialFirstRun && trialExpiresAt && currentLicense?.tamperSeal) {
      const isSealValid = verifyLicenseTamperSeal({
        hardwareId: hwid,
        firstRunDate: trialFirstRun,
        trialExpiresAt: trialExpiresAt,
        maxMonotonicTime: currentLicense.maxMonotonicTime,
        isActivated: false,
        licenseKey: '',
        tier: 'TRIAL',
      }, currentLicense.tamperSeal);

      if (!isSealValid) {
        return NextResponse.json({
          status: 'FILE_TAMPERED',
          hardwareId: hwid,
          isLicensed: false,
          isTrial: true,
          isExpired: true,
          isClockTampered: false,
          isTampered: true,
          developerPhone: DEVELOPER_PHONE,
          developerWhatsApp: DEVELOPER_WHATSAPP,
          message: 'تم رصد تعديل يدوي غير مصرح به على ملفات ترخيص النظام! يرجى التواصل مع المطور لتفعيل نسختك المعتمدة.',
        });
      }
    }

    // Anti-Reset Check: If JSON has no trial, check if SQLite has historical records
    if (!trialFirstRun || !trialExpiresAt) {
      let isPriorInstallation = false;
      let priorDate: string | null = null;

      try {
        if (prisma && prisma.sample) {
          const sampleCount = await prisma.sample.count();
          if (sampleCount > 0) {
            isPriorInstallation = true;
            const oldestSample = await prisma.sample.findFirst({
              orderBy: { createdAt: 'asc' },
              select: { createdAt: true },
            });
            if (oldestSample?.createdAt) {
              priorDate = new Date(oldestSample.createdAt).toISOString();
            }
          }
        }

        if (prisma && prisma.license) {
          const priorTrial = await prisma.license.findFirst({
            where: { hardwareId: hwid },
            orderBy: { expiryDate: 'desc' },
          });
          if (priorTrial) {
            isPriorInstallation = true;
            trialExpiresAt = new Date(priorTrial.expiryDate).toISOString();
          }
        }
      } catch {
        // Fallback
      }

      if (isPriorInstallation) {
        // File was deleted to reset trial! Deny fresh trial and force lock.
        trialFirstRun = priorDate || new Date(nowMs - (TRIAL_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
        trialExpiresAt = trialExpiresAt || new Date(nowMs - 1000).toISOString();
        trialFinished = true;
      } else {
        // Legitimate fresh first run: Initialize 2-Day Trial
        trialFirstRun = now.toISOString();
        const exp = new Date(nowMs + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        trialExpiresAt = exp.toISOString();

        // Mirror initial trial record into SQLite
        try {
          if (prisma && prisma.license) {
            await prisma.license.create({
              data: {
                hardwareId: hwid,
                signature: 'INITIAL_2_DAYS_FREE_TRIAL',
                expiryDate: exp,
                tier: 'TRIAL',
              },
            });
          }
        } catch {
          // Ignored
        }
      }

      // Generate HMAC seal for fresh trial
      const newSeal = createLicenseTamperSeal({
        hardwareId: hwid,
        firstRunDate: trialFirstRun,
        trialExpiresAt: trialExpiresAt,
        maxMonotonicTime: now.toISOString(),
        isActivated: false,
        licenseKey: '',
        tier: 'TRIAL',
      });

      updateLicenseStore({
        hardwareId: hwid,
        isActivated: false,
        firstRunDate: trialFirstRun,
        trialExpiresAt: trialExpiresAt,
        lastClockCheck: now.toISOString(),
        maxMonotonicTime: now.toISOString(),
        tamperSeal: newSeal,
        trialFinished,
      });
    }

    // Advance monotonic tracker and update seal
    const updatedMonotonic = nowMs > maxHistoricalTimeMs ? now.toISOString() : (currentLicense?.maxMonotonicTime || now.toISOString());
    const updatedSeal = createLicenseTamperSeal({
      hardwareId: hwid,
      firstRunDate: trialFirstRun,
      trialExpiresAt: trialExpiresAt,
      maxMonotonicTime: updatedMonotonic,
      isActivated: false,
      licenseKey: '',
      tier: 'TRIAL',
    });

    updateLicenseStore({
      lastClockCheck: now.toISOString(),
      maxMonotonicTime: updatedMonotonic,
      tamperSeal: updatedSeal,
    });

    const trialExpDate = new Date(trialExpiresAt);
    const trialDiffMs = trialExpDate.getTime() - nowMs;
    const trialDaysLeft = Math.max(0, Math.ceil(trialDiffMs / (1000 * 60 * 60 * 24)));
    const trialHoursLeft = Math.max(0, Math.ceil(trialDiffMs / (1000 * 60 * 60)));
    const isTrialExpired = trialFinished || now > trialExpDate || trialDiffMs <= 0;

    if (isTrialExpired) {
      if (!currentLicense?.trialFinished) {
        updateLicenseStore({ trialFinished: true });
      }

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
        message: 'انتهت الفترة التجريبية المجانية (يومين). يرجى إرسال كود بصمة الجهاز إلى المطور لتفعيل البرنامج بشكل دائم أو مؤقت.',
      });
    }

    // Trial is ACTIVE! (Within 48 hours)
    const timeRemainingMsg = trialHoursLeft > 24 
      ? 'فترة تجريبية مجانية (متبقي يومان - 48 ساعة)'
      : `فترة تجريبية مجانية (متبقي ${trialHoursLeft} ساعة على الانتهاء)`;

    return NextResponse.json({
      status: 'TRIAL',
      hardwareId: hwid,
      isLicensed: true,
      isTrial: true,
      isExpired: false,
      isClockTampered: false,
      tier: 'TRIAL',
      daysLeft: trialDaysLeft,
      hoursLeft: trialHoursLeft,
      expiryDate: trialExpiresAt,
      developerPhone: DEVELOPER_PHONE,
      developerWhatsApp: DEVELOPER_WHATSAPP,
      message: timeRemainingMsg,
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
