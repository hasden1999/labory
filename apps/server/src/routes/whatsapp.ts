import { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';

export async function whatsappRoutes(fastify: FastifyInstance) {
  // Connection status & QR
  fastify.post('/whatsapp/connect', { onRequest: [fastify.authenticate, fastify.requireOwner] }, async (request, reply) => {
    // Generate QR stub for Baileys session pairing
    const dummySessionCode = `LABMANAGER_WA_SESSION_${Date.now()}`;
    const qrDataUrl = await QRCode.toDataURL(dummySessionCode);

    return reply.send({
      status: 'PAIRING',
      message: 'افتح واتساب في هاتفك وامسح الرمز أدناه للربط',
      qrDataUrl,
    });
  });

  // Send Result to Patient via WhatsApp (Multi-form image dispatcher)
  fastify.post('/whatsapp/send-result/:sampleId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { sampleId } = request.params as { sampleId: string };
    const { prisma } = await import('../prisma');

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

    const tests = sample.tests || [];
    const isCbc = (t: any) => {
      const code = (t.test?.code || '').toUpperCase();
      const name = (t.test?.name || '').toLowerCase();
      const val = typeof t.resultValue === 'string' ? t.resultValue : '';
      return code === 'CBC' || code === 'FBC' || name.includes('complete blood count') || name.includes('صورة الدم') || val.includes('CBC');
    };
    const isGue = (t: any) => {
      const code = (t.test?.code || '').toUpperCase();
      const name = (t.test?.name || '').toLowerCase();
      const val = typeof t.resultValue === 'string' ? t.resultValue : '';
      return !isCbc(t) && (code === 'GUE' || name.includes('urine') || name.includes('إدرار') || val.includes('G.U.E'));
    };
    const isGse = (t: any) => {
      const code = (t.test?.code || '').toUpperCase();
      const name = (t.test?.name || '').toLowerCase();
      const val = typeof t.resultValue === 'string' ? t.resultValue : '';
      return !isCbc(t) && !isGue(t) && (code === 'GSE' || name.includes('stool') || name.includes('خروج') || val.includes('G.S.E'));
    };
    const isSfa = (t: any) => {
      const code = (t.test?.code || '').toUpperCase();
      const name = (t.test?.name || '').toLowerCase();
      const val = typeof t.resultValue === 'string' ? t.resultValue : '';
      return !isCbc(t) && !isGue(t) && !isGse(t) && (code === 'SFA' || name.includes('semen') || name.includes('سائل منوي') || val.includes('SEMINAL'));
    };

    const forms: any[] = [];
    const cbcTests = tests.filter(isCbc);
    const gueTests = tests.filter(isGue);
    const gseTests = tests.filter(isGse);
    const sfaTests = tests.filter(isSfa);
    const generalTests = tests.filter((t: any) => !isCbc(t) && !isGue(t) && !isGse(t) && !isSfa(t));

    if (generalTests.length > 0) {
      forms.push({ section: 'general', title: 'الكيمياء السريرية والفحوصات الروتينية', count: generalTests.length });
    }
    if (cbcTests.length > 0) {
      forms.push({ section: 'cbc', title: 'صورة الدم الكاملة (CBC)', count: cbcTests.length });
    }
    if (gueTests.length > 0) {
      forms.push({ section: 'gue', title: 'الفحص العام للإدرار (G.U.E)', count: gueTests.length });
    }
    if (gseTests.length > 0) {
      forms.push({ section: 'gse', title: 'الفحص العام للخروج (G.S.E)', count: gseTests.length });
    }
    if (sfaTests.length > 0) {
      forms.push({ section: 'sfa', title: 'فحص السائل المنوي (S.F.A)', count: sfaTests.length });
    }

    const patientPhone = sample.patient?.phone || '';
    let cleanPhone = patientPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('07') && cleanPhone.length === 11) cleanPhone = '964' + cleanPhone.substring(1);

    return reply.send({
      success: true,
      sampleId: sample.id,
      sampleNumber: sample.sampleNumber,
      patientName: sample.patient?.name,
      patientPhone,
      cleanPhone,
      totalForms: forms.length,
      forms: forms.map((f, i) => ({
        ...f,
        caption: `📄 صورة (${i + 1}/${forms.length}): تقرير ${f.title} - عينة #${sample.sampleNumber}`,
        imageUrl: `/api/samples/${sample.id}/image?section=${f.section}`,
      })),
      message: `تم تجهيز ${forms.length} صور للفورمات الطبية للإرسال عبر واتساب بنجاح!`,
    });
  });
}
