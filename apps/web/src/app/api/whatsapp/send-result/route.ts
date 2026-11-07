import { NextResponse } from 'next/server';
import { getStore, saveStoreToFile, enrichSamplesWithDeltaCheck } from '../../../../lib/serverStore';
import { isCbcTest, isGueTest, isGseTest, isSfaTest, isAmhTest, isBhcgTest, isGeneralTest } from '../../../../lib/testClassifier';
import { generatePuppeteerPdf } from '../../../../lib/puppeteerPdfGenerator';
import { generateReportImages } from '../../../../lib/puppeteerImageGenerator';
import { whatsappWebEngine } from '../../../../lib/whatsappWebEngine';
import { buildArabicWhatsAppClinicalMessage, WaTestLine } from '../../../../lib/orderHelpers';
import { classifyResultRange } from '@lab-manager/domain';
import { formatEnglishDate } from '../../../../lib/formatters';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sampleId, phone: customPhone } = body;

    const store = getStore();
    const sample = store.samples.find(s => s.id === sampleId || String(s.sampleNumber) === sampleId);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

    // Ensure sample has prior values enriched
    enrichSamplesWithDeltaCheck(store.samples, sample.id);

    const patient = sample.patient || { name: 'المريض', phone: '' };
    const patientPhone = (customPhone || patient.phone || '').trim();
    const settings = store.settings;
    const labName = settings.labName || 'مختبر التحليلات الطبية';

    // Identify active medical sections for this sample
    const activeForms: {
      section: string;
      titleArabic: string;
      titleEnglish: string;
      imageUrl: string;
      printUrl: string;
      testCount: number;
    }[] = [];

    const tests = sample.tests || [];
    const cbcCount = tests.filter(isCbcTest).length;
    const gueCount = tests.filter(isGueTest).length;
    const gseCount = tests.filter(isGseTest).length;
    const sfaCount = tests.filter(isSfaTest).length;
    const amhCount = tests.filter(isAmhTest).length;
    const bhcgCount = tests.filter(isBhcgTest).length;
    const generalCount = tests.filter(isGeneralTest).length;

    if (generalCount > 0) {
      activeForms.push({
        section: 'general',
        titleArabic: 'الكيمياء السريرية والفحوصات الروتينية',
        titleEnglish: 'Clinical Chemistry & General Tests',
        imageUrl: `/api/samples/${sample.id}/image?section=general`,
        printUrl: `/api/samples/${sample.id}/print?section=general`,
        testCount: generalCount,
      });
    }

    if (cbcCount > 0) {
      activeForms.push({
        section: 'cbc',
        titleArabic: 'صورة الدم الكاملة (CBC)',
        titleEnglish: 'Complete Blood Count (CBC)',
        imageUrl: `/api/samples/${sample.id}/image?section=cbc`,
        printUrl: `/api/samples/${sample.id}/print?section=cbc`,
        testCount: cbcCount,
      });
    }

    if (gueCount > 0) {
      activeForms.push({
        section: 'gue',
        titleArabic: 'الفحص العام للإدرار (G.U.E)',
        titleEnglish: 'General Urine Examination (G.U.E)',
        imageUrl: `/api/samples/${sample.id}/image?section=gue`,
        printUrl: `/api/samples/${sample.id}/print?section=gue`,
        testCount: gueCount,
      });
    }

    if (gseCount > 0) {
      activeForms.push({
        section: 'gse',
        titleArabic: 'الفحص العام للخروج (G.S.E)',
        titleEnglish: 'General Stool Examination (G.S.E)',
        imageUrl: `/api/samples/${sample.id}/image?section=gse`,
        printUrl: `/api/samples/${sample.id}/print?section=gse`,
        testCount: gseCount,
      });
    }

    if (sfaCount > 0) {
      activeForms.push({
        section: 'sfa',
        titleArabic: 'فحص السائل المنوي (S.F.A)',
        titleEnglish: 'Seminal Fluid Analysis (S.F.A)',
        imageUrl: `/api/samples/${sample.id}/image?section=sfa`,
        printUrl: `/api/samples/${sample.id}/print?section=sfa`,
        testCount: sfaCount,
      });
    }

    if (amhCount > 0) {
      activeForms.push({
        section: 'amh',
        titleArabic: 'فحص هرمون مخزون المبيض (AMH)',
        titleEnglish: 'Anti-Mullerian Hormone (AMH)',
        imageUrl: `/api/samples/${sample.id}/image?section=amh`,
        printUrl: `/api/samples/${sample.id}/print?section=amh`,
        testCount: amhCount,
      });
    }

    if (bhcgCount > 0) {
      activeForms.push({
        section: 'bhcg',
        titleArabic: 'فحص الحمل الرقمي (β-HCG)',
        titleEnglish: 'Total Beta-HCG Assay',
        imageUrl: `/api/samples/${sample.id}/image?section=bhcg`,
        printUrl: `/api/samples/${sample.id}/print?section=bhcg`,
        testCount: bhcgCount,
      });
    }

    const totalForms = activeForms.length;

    // Patient Context for range / flag classification
    const patientContext = {
      gender: patient.gender,
      age: patient.age,
      birthDate: patient.birthDate,
      targetDate: sample.createdAt,
    };

    // Build Clinical Results Summary Lines
    const clinicalLines: WaTestLine[] = [];
    (sample.tests || []).forEach((t: any) => {
      const valStr = t.resultValue != null ? String(t.resultValue).trim() : '';
      if (!valStr) return;

      const evalResult = classifyResultRange(valStr, t.test || t, patientContext);
      const testName = t.test?.name || t.name || t.testCode || 'Test';
      const testUnit = t.test?.unit || t.unit || '';

      let previous: { value: string; date: string } | undefined = undefined;
      if (t.previousValue && String(t.previousValue).trim() !== '') {
        previous = {
          value: String(t.previousValue),
          date: t.previousDate ? formatEnglishDate(t.previousDate) : '',
        };
      }

      clinicalLines.push({
        name: testName,
        value: valStr,
        unit: testUnit,
        flag: evalResult?.flag,
        previous,
      });
    });

    const defaultGreeting = buildArabicWhatsAppClinicalMessage({
      labName,
      patientName: patient.name,
      sampleNumber: sample.sampleNumber,
      date: sample.createdAt ? formatEnglishDate(sample.createdAt) : undefined,
      lines: clinicalLines,
    });

    const formsWithCaptions = activeForms.map((f, idx) => ({
      ...f,
      caption: totalForms === 1
        ? defaultGreeting
        : `📄 صورة (${idx + 1}/${totalForms}): تقرير ${f.titleArabic} - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}\n${labName}`,
    }));

    // Clean phone number for wa.me format (Iraqi 07x -> 9647x)
    let cleanPhone = patientPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('07') && cleanPhone.length === 11) {
      cleanPhone = '964' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 10) {
      cleanPhone = '964' + cleanPhone;
    }

    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultGreeting)}` : null;

    // Active Server Dispatch via Built-in WhatsApp Web Engine (Baileys)
    if (body.autoSend === true || body.directSend === true) {
      const autoSendEnabled = (store.settings as any).whatsappAutoSendEnabled === true;
      if (body.autoSend === true && !body.forceSend && !autoSendEnabled) {
        return NextResponse.json(
          {
            success: false,
            delivered: false,
            message: 'الإرسال التلقائي عبر واتساب معطل من الإعدادات. يرجى تفعيله من الإعدادات أولاً.',
          },
          { status: 403 }
        );
      }

      if (!cleanPhone) {
        return NextResponse.json(
          {
            success: false,
            delivered: false,
            message: 'رقم هاتف المريض غير متوفر أو غير صالح للإرسال عبر واتساب.',
          },
          { status: 400 }
        );
      }

      try {
        const safeArabicPatient = (patient.name || 'مريض').replace(/[\\/:*?"<>|\s]/g, '_');
        const customCaption = body.caption || defaultGreeting;

        let sendResult: any;
        let imagesSentCount = 0;

        if (body.imagesBase64 && Array.isArray(body.imagesBase64) && body.imagesBase64.length > 0) {
          // Send pre-generated array of separate report images
          const totalImg = body.imagesBase64.length;
          imagesSentCount = totalImg;
          for (let i = 0; i < totalImg; i++) {
            const rawBase64 = body.imagesBase64[i];
            const isFirst = i === 0;
            const imgCaption = totalImg === 1
              ? customCaption
              : isFirst
              ? `${customCaption}\n\n📄 (صورة 1 من ${totalImg}) - تقرير التحاليل الطبية المعتمد`
              : `📄 صورة (${i + 1} من ${totalImg}): تقرير التحاليل الطبية المعتمد - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}\n${labName}`;

            const isJpeg = typeof rawBase64 === 'string' && rawBase64.startsWith('data:image/jpeg');
            const ext = isJpeg ? 'jpg' : 'png';
            const mime = isJpeg ? 'image/jpeg' : 'image/png';
            const imgFileName = `تقرير_طبي_عينة_${sample.sampleNumber}_صفحة_${i + 1}_${safeArabicPatient}.${ext}`;
            sendResult = await whatsappWebEngine.sendMedia({
              phone: cleanPhone,
              type: 'image',
              mediaBuffer: rawBase64,
              fileName: imgFileName,
              mimetype: mime,
              caption: imgCaption,
            });

            if (i < totalImg - 1) {
              await new Promise((r) => setTimeout(r, 350));
            }
          }
        } else if (body.imageBase64 && typeof body.imageBase64 === 'string') {
          // Send high-resolution report image directly
          imagesSentCount = 1;
          const isJpeg = body.imageBase64.startsWith('data:image/jpeg');
          const imgFileName = `تقرير_طبي_عينة_${sample.sampleNumber}_${safeArabicPatient}.${isJpeg ? 'jpg' : 'png'}`;
          sendResult = await whatsappWebEngine.sendMedia({
            phone: cleanPhone,
            type: 'image',
            mediaBuffer: body.imageBase64,
            fileName: imgFileName,
            mimetype: isJpeg ? 'image/jpeg' : 'image/png',
            caption: customCaption,
          });
        } else {
          // Automatically generate separate images for each page/card (e.g. Chemistry/Sugar + CBC + Urine/GUE)
          try {
            const reportImages = await generateReportImages(sample.id, request.url, {
              section: body.section,
              format: 'jpeg',
            });
            const totalImg = reportImages.length;
            imagesSentCount = totalImg;

            for (let i = 0; i < totalImg; i++) {
              const img = reportImages[i];
              const isFirst = i === 0;
              const imgCaption = totalImg === 1
                ? customCaption
                : isFirst
                ? `${customCaption}\n\n📄 (صورة 1 من ${totalImg}) - تقرير التحاليل الطبية المعتمد`
                : `📄 صورة (${i + 1} من ${totalImg}): تقرير التحاليل الطبية المعتمد - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}\n${labName}`;

              const imgFileName = `تقرير_طبي_عينة_${sample.sampleNumber}_صفحة_${i + 1}_${safeArabicPatient}.jpg`;
              sendResult = await whatsappWebEngine.sendMedia({
                phone: cleanPhone,
                type: 'image',
                mediaBuffer: img.buffer,
                fileName: imgFileName,
                mimetype: 'image/jpeg',
                caption: imgCaption,
              });

              if (i < totalImg - 1) {
                await new Promise((r) => setTimeout(r, 350));
              }
            }
          } catch (imgErr) {
            console.warn('[WhatsAppDispatch] Multi-image generation failed, falling back to PDF document:', imgErr);
            // Fallback: Generate authentic Puppeteer PDF report matching the exact print template and logo
            const pdfBuffer = body.pdfBase64
              ? Buffer.from(body.pdfBase64.includes(',') ? body.pdfBase64.split(',')[1] : body.pdfBase64, 'base64')
              : await generatePuppeteerPdf(sample.id, request.url);

            if (pdfBuffer.length > 100 * 1024 * 1024) {
              throw new Error('حجم ملف التقرير يتجاوز الحد المسموح به في واتساب');
            }

            const pdfFileName = `تقرير_طبي_عينة_${sample.sampleNumber}_${safeArabicPatient}.pdf`;
            sendResult = await whatsappWebEngine.sendMedia({
              phone: cleanPhone,
              type: 'document',
              mediaBuffer: pdfBuffer,
              fileName: pdfFileName,
              mimetype: 'application/pdf',
              caption: customCaption,
            });
          }
        }

        // Mark sample as delivered in store
        sample.status = 'DELIVERED' as any;
        (sample as any).whatsappSentAt = new Date().toISOString();
        saveStoreToFile();

        const successMsg = imagesSentCount > 1
          ? `تم إرسال ${imagesSentCount} صور منفصلة للتقرير الطبي إلى واتساب المريض (${patient.name}) بنجاح ✓`
          : `تم إرسال التقرير الطبي تلقائياً إلى واتساب المريض (${patient.name}) بنجاح ✓`;

        return NextResponse.json({
          success: true,
          delivered: true,
          messageId: sendResult?.messageId,
          sampleId: sample.id,
          sampleNumber: sample.sampleNumber,
          patientName: patient.name,
          patientPhone,
          cleanPhone,
          totalForms,
          imagesSentCount,
          message: successMsg,
        });
      } catch (fErr: any) {
        console.error('[WhatsAppDispatch] Error:', fErr);
        return NextResponse.json(
          {
            success: false,
            delivered: false,
            message: fErr?.message || 'تعذر إرسال التقرير عبر جلسة واتساب ويب.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      delivered: false,
      sampleId: sample.id,
      sampleNumber: sample.sampleNumber,
      patientName: patient.name,
      patientPhone,
      cleanPhone,
      totalForms,
      forms: formsWithCaptions,
      defaultGreeting,
      waLink,
      message: `تم تجهيز ${totalForms} صور للفورمات الطبية للإرسال عبر واتساب بنجاح.`,
    });
  } catch (err: any) {
    console.error('[WhatsAppDispatch] Error:', err);
    return NextResponse.json({ message: err?.message || 'فشل تجهيز إرسال الواتساب' }, { status: 500 });
  }
}
