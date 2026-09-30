import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';
import { isCbcTest, isGueTest, isGseTest, isSfaTest, isGeneralTest } from '../../../../lib/testClassifier';
import { generatePuppeteerPdf } from '../../../../lib/puppeteerPdfGenerator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sampleId, phone: customPhone } = body;

    const store = getStore();
    const sample = store.samples.find(s => s.id === sampleId || String(s.sampleNumber) === sampleId);

    if (!sample) {
      return NextResponse.json({ message: 'العينة غير موجودة' }, { status: 404 });
    }

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

    const totalForms = activeForms.length;
    const formsWithCaptions = activeForms.map((f, idx) => ({
      ...f,
      caption: `📄 صورة (${idx + 1}/${totalForms}): تقرير ${f.titleArabic} - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}\n${labName}`,
    }));

    // Clean phone number for wa.me format (Iraqi 07x -> 9647x)
    let cleanPhone = patientPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('07') && cleanPhone.length === 11) {
      cleanPhone = '964' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 10) {
      cleanPhone = '964' + cleanPhone;
    }

    const defaultGreeting = `السلام عليكم ورحمة الله وبركاته.\nالأخ/الأخت الفاضل(ة): ${patient.name}\n\nيسر (${labName}) إعلامكم بصدور نتائج تحاليلكم الطبية المعتمدة للعينة رقم (#${sample.sampleNumber}).\nمرفق لكم طياً التقرير الطبي المعتمد بصيغة (PDF).\n\nنتمنى لكم دوام الصحة والعافية!`;
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultGreeting)}` : null;

    // Active Server Dispatch via Authentic Baileys Engine (FEAT-07: Real Puppeteer PDF Document)
    if (body.autoSend === true) {
      const SERVER_URL = process.env.FASTIFY_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000';
      try {
        // 1. Generate authentic Puppeteer PDF report matching the exact print template and logo
        const pdfBuffer = await generatePuppeteerPdf(sample.id, request.url);

        // 2. Validate file size against WhatsApp document limits (100MB max)
        if (pdfBuffer.length > 100 * 1024 * 1024) {
          throw new Error('حجم ملف التقرير يتجاوز الحد المسموح به في واتساب');
        }

        const safeArabicPatient = (patient.name || 'مريض').replace(/[\\/:*?"<>|\s]/g, '_');
        const pdfFileName = `تقرير_طبي_عينة_${sample.sampleNumber}_${safeArabicPatient}.pdf`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const serverRes = await fetch(`${SERVER_URL}/whatsapp/send-result/${sample.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleId: sample.id,
            phone: patientPhone,
            autoSend: true,
            pdfBase64: pdfBuffer.toString('base64'),
            fileName: pdfFileName,
            asImage: Boolean(body.asImage),
            caption: `📄 التقرير الطبي المعتمد بصيغة PDF - عينة #${sample.sampleNumber}\nالمريض: ${patient.name}\n${labName}`,
          }),
          signal: controller.signal,
          cache: 'no-store',
        }).finally(() => clearTimeout(timeoutId));

        const serverData = await serverRes.json();
        return NextResponse.json(serverData, { status: serverRes.status });
      } catch (fErr: any) {
        console.error('[WhatsAppDispatch] Error:', fErr);
        return NextResponse.json(
          {
            success: false,
            delivered: false,
            message: fErr?.message || 'تعذر الاتصال بمحرك واتساب المحلي لإرسال التقرير للمريض.',
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
    return NextResponse.json({ message: err?.message || 'فشل تجهيز صور الواتساب' }, { status: 500 });
  }
}
