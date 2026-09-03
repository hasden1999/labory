import { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';
import { prisma } from '../prisma';

export const SampleStatus = {
  RECEIVED: 'RECEIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
} as const;

export async function resultRoutes(fastify: FastifyInstance) {
  // Batch Save Results for a Sample with Smart Evaluations & Auto-Calculations
  fastify.post('/samples/:sampleId/results', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    const { sampleId } = request.params as { sampleId: string };
    const body = request.body as any || {};
    const results = body.results || body.tests || (Array.isArray(body) ? body : null);

    if (!results || !Array.isArray(results)) {
      return reply.status(400).send({ message: 'النتائج المطلوبة غير صحيحة' });
    }

    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        tests: { include: { test: true } },
      },
    });

    if (!sample) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }

    function isFemalePatient(gender?: string | null): boolean {
      if (!gender) return false;
      const g = gender.trim().toLowerCase();
      return g === 'أنثى' || g === 'انثى' || g === 'female' || g === 'f';
    }

    const isFemale = isFemalePatient(sample.patient.gender);

    for (const item of results) {
      const sampleTest = sample.tests.find((t) => t.id === item.sampleTestId);
      if (!sampleTest) continue;

      let isAbnormal = false;
      let isCritical = false;
      const numVal = parseFloat(item.resultValue);

      // Determine low and high reference ranges based on gender
      let low = sampleTest.test.refRangeLow;
      let high = sampleTest.test.refRangeHigh;

      if (isFemale && sampleTest.test.normalFemaleLow !== null && sampleTest.test.normalFemaleHigh !== null) {
        low = sampleTest.test.normalFemaleLow;
        high = sampleTest.test.normalFemaleHigh;
      } else if (!isFemale && sampleTest.test.normalMaleLow !== null && sampleTest.test.normalMaleHigh !== null) {
        low = sampleTest.test.normalMaleLow;
        high = sampleTest.test.normalMaleHigh;
      }

      const critLow = sampleTest.test.criticalLow;
      const critHigh = sampleTest.test.criticalHigh;

      if (!isNaN(numVal)) {
        if (low !== null && numVal < low) isAbnormal = true;
        if (high !== null && numVal > high) isAbnormal = true;

        if (critLow !== null && numVal < critLow) isCritical = true;
        if (critHigh !== null && numVal > critHigh) isCritical = true;
      }

      await prisma.sampleTest.update({
        where: { id: item.sampleTestId },
        data: {
          resultValue: item.resultValue,
          notes: item.notes || null,
          interpretation: item.interpretation || null,
          isAbnormal,
          isCritical,
          enteredById: user?.id || 'single_operator',
          enteredAt: new Date(),
        },
      });
    }

    // Auto-calculate derivative values if parent tests are present in the sample
    const refreshedTests = await prisma.sampleTest.findMany({
      where: { sampleId },
      include: { test: true },
    });

    // 1. Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
    const tsbTest = refreshedTests.find((t) => t.test.code === 'TSB' && t.resultValue);
    const dirBilTest = refreshedTests.find((t) => t.test.code === 'DIR-BIL' && t.resultValue);
    const indirBilTest = refreshedTests.find((t) => t.test.code === 'INDIR-BIL');

    if (tsbTest && dirBilTest && indirBilTest && !indirBilTest.resultValue) {
      const tsbVal = parseFloat(tsbTest.resultValue || '0');
      const dirVal = parseFloat(dirBilTest.resultValue || '0');
      if (!isNaN(tsbVal) && !isNaN(dirVal)) {
        if (dirVal > tsbVal) {
          await prisma.sampleTest.update({
            where: { id: indirBilTest.id },
            data: {
              resultValue: '0.00',
              interpretation: 'تنبيه: Direct Bilirubin أعلى من Total Bilirubin (فحص معملي يلزم إعادة التحقق).',
              isAbnormal: true,
              enteredById: 'system_calc',
              enteredAt: new Date(),
            },
          });
        } else {
          const indirVal = (tsbVal - dirVal).toFixed(2);
          await prisma.sampleTest.update({
            where: { id: indirBilTest.id },
            data: {
              resultValue: indirVal,
              enteredById: 'system_calc',
              enteredAt: new Date(),
            },
          });
        }
      }
    }

    // 2. Lipid calculations: LDL & VLDL & Chol/HDL Ratio (Friedewald Protocol)
    const cholTest = refreshedTests.find((t) => t.test.code === 'CHOL' && t.resultValue);
    const tgTest = refreshedTests.find((t) => t.test.code === 'TG' && t.resultValue);
    const hdlTest = refreshedTests.find((t) => t.test.code === 'HDL' && t.resultValue);
    const ldlTest = refreshedTests.find((t) => t.test.code === 'LDL');
    const vldlTest = refreshedTests.find((t) => t.test.code === 'VLDL');

    if (cholTest && tgTest && hdlTest) {
      const c = parseFloat(cholTest.resultValue || '0');
      const tg = parseFloat(tgTest.resultValue || '0');
      const hdl = parseFloat(hdlTest.resultValue || '0');

      if (!isNaN(c) && !isNaN(tg) && !isNaN(hdl)) {
        if (tg >= 400) {
          // TG >= 400 mg/dL invalidates Friedewald equation
          if (ldlTest && !ldlTest.resultValue) {
            await prisma.sampleTest.update({
              where: { id: ldlTest.id },
              data: {
                resultValue: 'غير صالح (TG ≥ 400)',
                interpretation: 'معادلة فريدوالد غير صالحة لارتفاع الدهون الثلاثية عن 400 mg/dL - يلزم طلب فحص Direct LDL المباشر.',
                isAbnormal: true,
                enteredById: 'system_calc',
                enteredAt: new Date(),
              },
            });
          }
          if (vldlTest && !vldlTest.resultValue) {
            await prisma.sampleTest.update({
              where: { id: vldlTest.id },
              data: {
                resultValue: 'غير صالح (TG ≥ 400)',
                interpretation: 'غير دقيق بسبب فرط ثلاثي الغليسريد.',
                isAbnormal: true,
                enteredById: 'system_calc',
                enteredAt: new Date(),
              },
            });
          }
        } else {
          if (vldlTest && !vldlTest.resultValue) {
            const vldlVal = (tg / 5).toFixed(1);
            await prisma.sampleTest.update({
              where: { id: vldlTest.id },
              data: { resultValue: vldlVal, enteredById: 'system_calc', enteredAt: new Date() },
            });
          }
          if (ldlTest && !ldlTest.resultValue) {
            const ldlVal = Math.max(0, c - hdl - tg / 5).toFixed(1);
            await prisma.sampleTest.update({
              where: { id: ldlTest.id },
              data: { resultValue: ldlVal, enteredById: 'system_calc', enteredAt: new Date() },
            });
          }
        }
      }
    }

    // 3. eGFR calculation from Creatinine and Age/Gender (2021 CKD-EPI Race-Free Standard)
    const creatTest = refreshedTests.find((t) => t.test.code === 'CREAT' && t.resultValue);
    const egfrTest = refreshedTests.find((t) => t.test.code === 'EGFR');
    if (creatTest && egfrTest && !egfrTest.resultValue && sample.patient.age) {
      const cr = parseFloat(creatTest.resultValue || '0');
      const age = sample.patient.age;
      if (cr > 0 && age > 0) {
        // 2021 CKD-EPI Race-Free formula
        const isF = isFemalePatient(sample.patient.gender);
        const k = isF ? 0.7 : 0.9;
        const a = isF ? -0.241 : -0.302;
        const fMultiplier = isF ? 1.012 : 1.0;
        const egfrVal = Math.round(
          142 *
          Math.pow(Math.min(cr / k, 1), a) *
          Math.pow(Math.max(cr / k, 1), -1.200) *
          Math.pow(0.9938, age) *
          fMultiplier
        );
        const stage =
          egfrVal >= 90 ? 'G1: وظائف كلى طبيعية أو مرتفعة' :
          egfrVal >= 60 ? 'G2: انخفاض طفيف في وظائف الكلى' :
          egfrVal >= 45 ? 'G3a: انخفاض طفيف إلى متوسط' :
          egfrVal >= 30 ? 'G3b: انخفاض متوسط إلى شديد' :
          egfrVal >= 15 ? 'G4: انخفاض شديد في وظائف الكلى' : 'G5: قصور كلوي متقدم';

        await prisma.sampleTest.update({
          where: { id: egfrTest.id },
          data: {
            resultValue: String(egfrVal),
            interpretation: `${stage} (معادلة 2021 CKD-EPI)`,
            isAbnormal: egfrVal < 60,
            isCritical: egfrVal < 15,
            enteredById: 'system_calc',
            enteredAt: new Date(),
          },
        });
      }
    }

    // Update status of sample
    const finalTests = await prisma.sampleTest.findMany({
      where: { sampleId },
    });

    const completedCount = finalTests.filter((t) => t.resultValue && t.resultValue.trim() !== '').length;
    let newStatus: string = SampleStatus.IN_PROGRESS;
    if (completedCount === finalTests.length && finalTests.length > 0) {
      newStatus = SampleStatus.READY;
    }

    await prisma.sample.update({
      where: { id: sampleId },
      data: { status: newStatus },
    });

    const updatedSample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        doctor: true,
        tests: { include: { test: true } },
      },
    });

    return reply.send(updatedSample);
  });

  // Official A4 Medical Diagnostic Report HTML
  fastify.get('/samples/:sampleId/print', async (request, reply) => {
    const { sampleId } = request.params as { sampleId: string };

    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        doctor: true,
        tests: { include: { test: true } },
      },
    });

    if (!sample) {
      return reply.status(404).send('<h1>العينة غير موجودة</h1>');
    }

    const settings = (await prisma.settings.findUnique({ where: { id: 'singleton' } })) || {
      labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
      labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل',
      doctorName: 'د. أحمد الرضا',
      doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
      labLicense: 'MOH-IQ-2026-8842',
      address: 'بغداد - شارع الأطباء - مقابل المجمع الطبي المركزي',
      phone: '07701234567 / 07801234567',
      reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً.',
    };

    // Generate Verification QR Code
    const qrPayload = `https://lab-verify.med/samples/${sample.sampleNumber}?id=${sample.id}&patient=${encodeURIComponent(sample.patient.name)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 110 });

    const formattedDate = new Date(sample.createdAt).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = new Date(sample.createdAt).toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isFemale = sample.patient.gender === 'أنثى';

    const testRowsHtml = sample.tests
      .map((t) => {
        let refRange = t.refRangeText || '';
        if (!refRange) {
          let low = t.refRangeLow ?? t.test.refRangeLow;
          let high = t.refRangeHigh ?? t.test.refRangeHigh;
          if (isFemale && t.test.normalFemaleLow !== null && t.test.normalFemaleHigh !== null) {
            low = t.test.normalFemaleLow;
            high = t.test.normalFemaleHigh;
          } else if (!isFemale && t.test.normalMaleLow !== null && t.test.normalMaleHigh !== null) {
            low = t.test.normalMaleLow;
            high = t.test.normalMaleHigh;
          }
          if (low !== null && high !== null) refRange = `${low} - ${high}`;
        }

        let flagBadge = '<span class="status-normal">طبيعي (Normal)</span>';
        if (t.isCritical) {
          flagBadge = '<span class="status-critical">⚠️ حرج جداً (Critical Panic)</span>';
        } else if (t.isAbnormal) {
          flagBadge = '<span class="status-abnormal">⚠️ غير طبيعي (Abnormal)</span>';
        }

        let displayValue = t.resultValue ?? '<span style="color:#94a3b8;">Pending</span>';
        if (t.resultValue && (t.resultValue.includes('[GENERAL URINE EXAMINATION - G.U.E]') || t.resultValue.includes('[G.U.E ANALYSIS]') || t.resultValue.includes('G.U.E]'))) {
          const raw = t.resultValue.replace(/\[.*?G\.?U\.?E.*?\]/gi, '').trim();
          const lines = raw.split('\n').filter(Boolean);
          
          let physicalHtml = '';
          let chemicalHtml = '';
          let microHtml = '';
          let notesHtml = '';

          lines.forEach((line: string) => {
            const cleanLine = line.trim();
            if (cleanLine.toUpperCase().startsWith('PHYSICAL:') || cleanLine.toUpperCase().startsWith('PHYSICAL EXAM:')) {
              const parts = cleanLine.replace(/PHYSICAL(\s+EXAM)?:/i, '').split('|').map(p => p.trim()).filter(Boolean);
              physicalHtml = `
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">PHYSICAL EXAMINATION</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 10.5px;">
                    ${parts.map(p => `<div style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${p}</div>`).join('')}
                  </div>
                </div>
              `;
            } else if (cleanLine.toUpperCase().startsWith('CHEMICAL:') || cleanLine.toUpperCase().startsWith('CHEMICAL EXAM:')) {
              const parts = cleanLine.replace(/CHEMICAL(\s+EXAM)?:/i, '').split('|').map(p => p.trim()).filter(Boolean);
              chemicalHtml = `
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">CHEMICAL EXAMINATION</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 10.5px;">
                    ${parts.map(p => {
                      const isAbn = p.includes('1+') || p.includes('2+') || p.includes('3+') || p.includes('4+') || p.includes('Positive');
                      return `<div style="background: ${isAbn ? '#fef2f2' : '#ffffff'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '700' : '500'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${p}</div>`;
                    }).join('')}
                  </div>
                </div>
              `;
            } else if (cleanLine.toUpperCase().startsWith('MICROSCOPIC:') || cleanLine.toUpperCase().startsWith('MICROSCOPIC EXAM:')) {
              const parts = cleanLine.replace(/MICROSCOPIC(\s+EXAM)?:/i, '').split('|').map(p => p.trim()).filter(Boolean);
              microHtml = `
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 4px;">MICROSCOPIC EXAMINATION (HPF)</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 10.5px;">
                    ${parts.map(p => {
                      const isAbn = p.includes('8-10') || p.includes('15-20') || p.includes('25-35') || p.includes('40-50') || p.includes('Full') || p.includes('Bloody') || p.includes('++++') || p.includes('+++') || p.includes('++');
                      return `<div style="background: ${isAbn ? '#fef2f2' : '#ffffff'}; color: ${isAbn ? '#b91c1c' : '#1e293b'}; font-weight: ${isAbn ? '700' : '500'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isAbn ? '#fca5a5' : '#e2e8f0'};">${p}</div>`;
                    }).join('')}
                  </div>
                </div>
              `;
            } else if (cleanLine.toUpperCase().startsWith('NOTES:') || cleanLine.toUpperCase().startsWith('NOTE:')) {
              notesHtml = `
                <div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 4px 8px; font-size: 10.5px; color: #334155; margin-top: 4px; border-radius: 0 4px 4px 0;">
                  <strong>Note:</strong> ${cleanLine.replace(/NOTES?:/i, '').trim()}
                </div>
              `;
            } else {
              notesHtml += `<div style="font-size: 10px; color: #475569; margin-top: 2px;">${cleanLine}</div>`;
            }
          });

          displayValue = `
            <div style="text-align: left; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; max-width: 460px; margin: 4px 0;">
              ${physicalHtml}
              ${chemicalHtml}
              ${microHtml}
              ${notesHtml}
            </div>
          `;
        }

        return `
          <tr>
            <td style="font-weight: 800; color: #0f172a;">
              <div>${t.test.name}</div>
            </td>
            <td>
              <span class="res-value ${t.isCritical ? 'val-critical' : t.isAbnormal ? 'val-abnormal' : 'val-normal'}">
                ${displayValue}
              </span>
            </td>
            <td style="color: #475569; font-weight: 700;">${t.unit || t.test.unit || '-'}</td>
            <td style="color: #334155; font-weight: 600;">${refRange || '-'}</td>
            <td style="font-size: 11px; color: #475569; max-width: 180px;">${t.interpretation || t.notes || '-'}</td>
          </tr>
        `;
      })
      .join('');

    const template = ((settings as any)?.reportTemplate || 'CLASSIC').toUpperCase();
    
    // Dynamic theme variables based on chosen template
    let primaryColor = '#0284c7';
    let thBg = '#0f172a';
    let patientBg = '#f1f5f9';
    let headerHtml = `
      <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primaryColor}; padding-bottom: 16px; margin-bottom: 20px;">
        <div class="branding" style="text-align: left;">
          <h1 style="font-size: 22px; color: ${primaryColor}; font-weight: 900;">🧪 ${settings.labName}</h1>
          <p style="font-size: 12px; color: #64748b; font-weight: 600; margin-top: 2px;">${settings.labSubtitle || 'Advanced Medical & Clinical Diagnostics'}</p>
          <p style="font-size: 11px; color: #475569; margin-top: 4px;">📍 ${settings.address || ''} | 📞 ${settings.phone || ''}</p>
        </div>
        <div class="doctor-meta" style="text-align: right;">
          <h3 style="font-size: 15px; color: #0f172a; font-weight: 800;">${settings.doctorName || 'Consultant Pathologist'}</h3>
          <p style="font-size: 11px; color: #475569;">${settings.doctorTitle || 'Clinical Laboratory Director'}</p>
          <p style="font-size: 10px; color: #64748b;">MOH License: ${settings.labLicense || 'MOH-2026'}</p>
        </div>
      </div>
    `;
    let watermarkHtml = '';

    if (template === 'MODERN') {
      primaryColor = '#0d9488';
      thBg = '#0f766e';
      patientBg = '#f0fdfa';
      headerHtml = `
        <div style="background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%); color: #fff; padding: 18px 24px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.2);">
          <div style="text-align: left;">
            <h1 style="font-size: 23px; font-weight: 900; margin: 0; color: #fff;">🧪 ${settings.labName}</h1>
            <p style="font-size: 12px; opacity: 0.95; margin: 4px 0 0 0;">${settings.labSubtitle || 'Advanced Medical & Clinical Diagnostics'}</p>
            <p style="font-size: 11px; opacity: 0.85; margin: 4px 0 0 0;">📍 ${settings.address || ''} | 📞 ${settings.phone || ''}</p>
          </div>
          <div style="text-align: right; background: rgba(255, 255, 255, 0.15); padding: 8px 14px; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: 800; margin: 0; color: #fff;">${settings.doctorName || 'Consultant Pathologist'}</h3>
            <p style="font-size: 10.5px; opacity: 0.9; margin: 2px 0 0 0;">${settings.doctorTitle || 'Clinical Laboratory Director'}</p>
            <span style="font-size: 9.5px; background: rgba(255, 255, 255, 0.25); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">License: ${settings.labLicense || 'MOH-2026'}</span>
          </div>
        </div>
      `;
    } else if (template === 'EXECUTIVE') {
      primaryColor = '#1e3a8a';
      thBg = '#1e293b';
      patientBg = '#f8fafc';
      watermarkHtml = `<div style="position: absolute; top: 45%; left: 20%; transform: rotate(-30deg); font-size: 70px; color: rgba(30, 58, 138, 0.035); font-weight: 900; pointer-events: none; user-select: none;">OFFICIAL REPORT</div>`;
      headerHtml = `
        <div style="border-bottom: 3px double #b45309; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="text-align: left;">
            <span style="font-size: 10px; background: #b45309; color: #fff; padding: 2px 8px; border-radius: 3px; font-weight: 800; letter-spacing: 0.5px;">OFFICIAL REPORT</span>
            <h1 style="font-size: 24px; color: #1e3a8a; font-weight: 900; margin-top: 4px;">🏛️ ${settings.labName}</h1>
            <p style="font-size: 12px; color: #64748b; font-weight: 600;">${settings.labSubtitle || 'Advanced Medical & Clinical Diagnostics'}</p>
            <p style="font-size: 11px; color: #475569; margin-top: 4px;">📍 ${settings.address || ''} | 📞 ${settings.phone || ''}</p>
          </div>
          <div style="text-align: right; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; background: #f8fafc;">
            <h3 style="font-size: 14px; color: #0f172a; font-weight: 900;">${settings.doctorName || 'Consultant Pathologist'}</h3>
            <p style="font-size: 11px; color: #475569;">${settings.doctorTitle || 'Clinical Laboratory Director'}</p>
            <p style="font-size: 10px; color: #b45309; font-weight: 700;">MOH License: ${settings.labLicense || 'MOH-2026'}</p>
          </div>
        </div>
      `;
    } else if (template === 'COMPACT') {
      primaryColor = '#334155';
      thBg = '#334155';
      patientBg = '#f8fafc';
    } else if (template === 'BLANK_WHITE' || template === 'PREPRINTED') {
      primaryColor = '#0f172a';
      thBg = '#1e293b';
      patientBg = '#ffffff';
      headerHtml = `
        <div class="letterhead-blank-space" style="height: 135px; width: 100%;"></div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Medical Diagnostic Report #${sample.sampleNumber} - ${settings.labName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Cairo', sans-serif;
            background: #f8fafc;
            color: #0f172a;
            padding: 24px;
            direction: ltr;
          }
          .action-bar {
            max-width: 800px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
          }
          .btn-print {
            background: ${primaryColor};
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
          }
          .btn-print:hover { opacity: 0.9; }

          .page-container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            padding: 30px;
            border-radius: 10px;
            position: relative;
          }

          .patient-box {
            background: ${patientBg};
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px 18px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
            text-align: left;
          }
          .box-item { display: flex; flex-direction: column; gap: 2px; }
          .box-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .box-value { font-size: 13px; color: #0f172a; font-weight: 800; }

          .stat-tag {
            background: #fee2e2;
            color: #dc2626;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 900;
            display: inline-block;
            border: 1px solid #fca5a5;
            margin-left: 6px;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 24px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
          }
          th {
            background: ${thBg};
            color: #fff;
            padding: 10px 14px;
            font-size: 12px;
            text-align: left;
            font-weight: 800;
          }
          td {
            padding: 10px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
            text-align: left;
          }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) { background: #fafafa; }

          .res-value { font-size: 14px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
          .val-normal { color: #059669; }
          .val-abnormal { color: #d97706; background: #fef3c7; border: 1px solid #fde68a; font-weight: 900; }
          .val-critical { color: #dc2626; background: #fee2e2; border: 1px solid #fca5a5; font-weight: 900; }

          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 2px dashed #cbd5e1;
            padding-top: 16px;
            margin-top: 24px;
          }
          .qr-container { display: flex; align-items: center; gap: 10px; }
          .qr-img { width: 75px; height: 75px; border: 1px solid #cbd5e1; border-radius: 6px; }
          .signature-stamp {
            text-align: center;
            border: 2px dashed ${primaryColor};
            padding: 8px 16px;
            border-radius: 8px;
            background: #f0f9ff;
          }

          @media print {
            body { padding: 0; background: #fff; }
            .action-bar { display: none; }
            .page-container { border: none; box-shadow: none; padding: 10px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <div>
            <strong>Medical Diagnostic Report (${template})</strong>
            <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">Sample #${sample.sampleNumber}</span>
          </div>
          <button onclick="window.print()" class="btn-print">🖨️ Print Report (A4)</button>
        </div>

        <div class="page-container">
          ${watermarkHtml}
          ${headerHtml}

          <div class="patient-box">
            <div class="box-item">
              <span class="box-label">Patient Name</span>
              <span class="box-value">
                ${sample.patient.name}
                ${sample.isUrgent ? '<span class="stat-tag">🚨 STAT</span>' : ''}
              </span>
            </div>
            <div class="box-item">
              <span class="box-label">Age / Gender</span>
              <span class="box-value">${sample.patient.age ? sample.patient.age + ' Y' : '-'} / ${sample.patient.gender || '-'}</span>
            </div>
            <div class="box-item">
              <span class="box-label">Sample ID & Date</span>
              <span class="box-value">#${sample.sampleNumber} | ${formattedDate}</span>
            </div>
            <div class="box-item">
              <span class="box-label">Ref. Doctor</span>
              <span class="box-value">${sample.doctor ? sample.doctor.name : 'Direct Visit'}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 32%;">Investigation</th>
                <th style="width: 20%;">Result</th>
                <th style="width: 12%;">Unit</th>
                <th style="width: 18%;">Reference Range</th>
                <th style="width: 18%;">Clinical Interpretation / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${testRowsHtml}
            </tbody>
          </table>

          <div class="footer-section">
            <div class="qr-container">
              <img src="${qrCodeDataUrl}" class="qr-img" alt="QR Code" />
              <div>
                <strong style="font-size: 12px; display: block; color: ${primaryColor};">تحقق إلكتروني مشفر (QR Verified)</strong>
                <span style="font-size: 10px; color: #64748b;">رمز التحقق المعتمد لنتائج العينة #${sample.sampleNumber}</span>
              </div>
            </div>

            <div class="signature-stamp">
              <div style="font-size: 11px; font-weight: 900; color: ${primaryColor};">الختم والتوقيع الإلكتروني المعتمد</div>
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${settings.doctorName || 'د. أحمد الرضا'}</div>
              <div style="font-size: 9px; color: #64748b;">رئيس قسم المختبر والتشخيص المرضي</div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8;">
            ${settings.reportFooter || 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً.'}
          </div>
        </div>
      </body>
      </html>
    `;

    reply.type('text/html').send(html);
  });

  // Thermal Receipt Printing Endpoint
  fastify.get('/samples/:sampleId/receipt', async (request, reply) => {
    const { sampleId } = request.params as { sampleId: string };
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        doctor: true,
        tests: { include: { test: true } },
      },
    });

    if (!sample) return reply.status(404).send('<h1>العينة غير موجودة</h1>');

    const settings = (await prisma.settings.findUnique({ where: { id: 'singleton' } })) || {
      labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
      phone: '07701234567',
      currency: 'د.ع',
    };

    const formattedDate = new Date(sample.createdAt).toLocaleString('ar-IQ');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>وصل استلام #${sample.sampleNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Cairo', sans-serif; width: 80mm; padding: 10px; font-size: 12px; color: #000; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .bold { font-weight: 800; }
          @media print { body { width: 100%; } }
        </style>
      </head>
      <body onload="window.print()">
        <div class="center">
          <h2 style="font-size: 15px; font-weight: 900;">${settings.labName}</h2>
          <p style="font-size: 10px;">وصل استلام وقبض مالي</p>
          <p style="font-size: 10px;">📞 ${settings.phone}</p>
        </div>
        <div class="divider"></div>
        <div class="row"><span class="bold">رقم العينة:</span><span class="bold">#${sample.sampleNumber}</span></div>
        <div class="row"><span>المريض:</span><span class="bold">${sample.patient.name}</span></div>
        <div class="row"><span>التاريخ:</span><span>${formattedDate}</span></div>
        <div class="row"><span>الطبيب:</span><span>${sample.doctor ? sample.doctor.name : 'فحص مباشر'}</span></div>
        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 4px;">الفحوصات المطلوبة:</div>
        ${sample.tests.map((t) => `<div class="row"><span>• ${t.test.name}</span><span>${t.priceAtTime.toLocaleString()} ${settings.currency}</span></div>`).join('')}
        <div class="divider"></div>
        <div class="row"><span>الإجمالي:</span><span>${(sample.priceTotal + sample.discount).toLocaleString()} ${settings.currency}</span></div>
        ${sample.discount > 0 ? `<div class="row"><span>الخصم:</span><span>- ${sample.discount.toLocaleString()} ${settings.currency}</span></div>` : ''}
        <div class="row bold"><span>الصافي المطلوب:</span><span>${sample.priceTotal.toLocaleString()} ${settings.currency}</span></div>
        <div class="row bold" style="color:#059669;"><span>المدفوع:</span><span>${sample.paidAmount.toLocaleString()} ${settings.currency}</span></div>
        ${sample.remainingAmount > 0 ? `<div class="row bold" style="color:#dc2626;"><span>المتبقي (دين):</span><span>${sample.remainingAmount.toLocaleString()} ${settings.currency}</span></div>` : '<div class="row bold" style="color:#059669;"><span>الحالة:</span><span>خالص المدفوعات</span></div>'}
        <div class="divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 8px;">
          شكراً لثقتكم بمختبرنا - نتمنى لكم دوام الصحة والعافية
        </div>
      </body>
      </html>
    `;
    reply.type('text/html').send(html);
  });

  // Tube Sticker Barcode & Thermal Label Generator (Code128 1D + QR 2D)
  const handleBarcodeSticker = async (request: any, reply: any) => {
    const { sampleId } = request.params as { sampleId: string };
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        doctor: true,
        tests: { include: { test: true } },
      },
    });

    if (!sample) return reply.status(404).send('<h1>العينة غير موجودة</h1>');

    const qrCodeDataUrl = await QRCode.toDataURL(String(sample.sampleNumber), { margin: 0, width: 80 });
    const testsSummary = sample.tests.map((t) => t.test.code || t.test.name).join(', ');
    const sampleTypes = Array.from(new Set(sample.tests.map((t) => t.test.sampleType).filter(Boolean))).join(' / ') || 'مصل الدم (Serum)';
    const formattedDate = new Date(sample.createdAt).toLocaleDateString('ar-IQ');
    const formattedTime = new Date(sample.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ملصق باركود عينة #${sample.sampleNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px;
          }

          .toolbar {
            width: 100%;
            max-width: 420px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #fff;
            padding: 8px 14px;
            border-radius: 8px;
            margin-bottom: 12px;
          }

          .btn-print {
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-family: inherit;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
          }
          .btn-print:hover { background: #0369a1; }

          /* Thermal Label Card (50mm x 25mm standard ratio) */
          .sticker-card {
            width: 50mm;
            height: 25mm;
            background: #ffffff;
            border: 1px solid #94a3b8;
            border-radius: 4px;
            padding: 2.5mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          .sticker-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            line-height: 1.1;
          }

          .sample-num {
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
          }

          .stat-flag {
            background: #dc2626;
            color: #fff;
            padding: 0 3px;
            border-radius: 2px;
            font-size: 8px;
            font-weight: 900;
          }

          .patient-name {
            font-size: 9.5px;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 32mm;
          }

          .patient-meta {
            font-size: 7.5px;
            color: #475569;
            font-weight: 600;
          }

          .barcode-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
            margin: 0.5mm 0;
          }

          .barcode-svg {
            width: 33mm;
            height: 10mm;
          }

          .qr-img {
            width: 10mm;
            height: 10mm;
          }

          .sticker-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7px;
            font-weight: 700;
            color: #334155;
            border-top: 0.5px solid #cbd5e1;
            padding-top: 0.5mm;
            line-height: 1;
          }

          .tests-list {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 35mm;
          }

          @media print {
            body { background: #fff; padding: 0; margin: 0; }
            .toolbar { display: none !important; }
            .sticker-card {
              border: none;
              box-shadow: none;
              width: 50mm;
              height: 25mm;
              page-break-after: always;
            }
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        
        <div class="toolbar">
          <div style="font-size: 12px; font-weight: 700;">
            <span>🏷️ ملصق عينة: </span>
            <strong style="color: #38bdf8;">#${sample.sampleNumber}</strong>
          </div>
          <button onclick="window.print()" class="btn-print">🖨️ طباعة الملصق الآن</button>
        </div>

        <div class="sticker-card">
          <div class="sticker-header">
            <div>
              <div class="patient-name">${sample.patient.name}</div>
              <div class="patient-meta">${sample.patient.age ? sample.patient.age + ' سنة' : ''} ${sample.patient.gender ? '• ' + sample.patient.gender : ''}</div>
            </div>
            <div style="text-align: left;">
              <span class="sample-num">#${sample.sampleNumber}</span>
              ${sample.isUrgent ? '<div class="stat-flag">STAT</div>' : ''}
            </div>
          </div>

          <div class="barcode-row">
            <svg id="barcode" class="barcode-svg"></svg>
            <img src="${qrCodeDataUrl}" class="qr-img" alt="QR" />
          </div>

          <div class="sticker-footer">
            <span class="tests-list">${testsSummary}</span>
            <span>${formattedDate}</span>
          </div>
        </div>

        <script>
          try {
            JsBarcode("#barcode", "${sample.sampleNumber}", {
              format: "CODE128",
              width: 1.4,
              height: 28,
              displayValue: false,
              margin: 0
            });
          } catch(e) {
            console.error("Barcode generation error:", e);
          }
        </script>
      </body>
      </html>
    `;
    reply.type('text/html').send(html);
  };

  fastify.get('/samples/:sampleId/barcode', handleBarcodeSticker);
  fastify.get('/samples/:sampleId/tube-label', handleBarcodeSticker);
}

