import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';
import { isCbcTest, isGueTest, isGseTest, isSfaTest, isGeneralTest } from '../../samples/[id]/print/route';

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

    const defaultGreeting = `السلام عليكم ورحمة الله وبركاته.\nالأخ/الأخت الفاضل(ة): ${patient.name}\n\nمرفق لكم تقرير نتائج الفحوصات الطبية المعتمدة من (${labName}) بعدد (${totalForms} ${totalForms === 1 ? 'صورة' : 'صور منفصلة'}).\nرقم العينة: #${sample.sampleNumber}\n\nنتمنى لكم دوام الصحة والعافية!`;
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultGreeting)}` : null;

    return NextResponse.json({
      success: true,
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
