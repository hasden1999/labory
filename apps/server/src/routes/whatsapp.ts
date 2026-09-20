import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import {
  whatsappService,
  formatToWhatsAppJID,
  cleanDisplayPhone,
  SendMediaParams,
} from '../services/whatsappService';
import { generateSampleReportPDF, ReportData } from '../utils/pdf';

export async function whatsappRoutes(fastify: FastifyInstance) {
  // 1. WhatsApp Connection Status & QR Code (Supports both /whatsapp/status and /api/whatsapp/status)
  const getStatusHandler = async (request: any, reply: any) => {
    try {
      const status = whatsappService.getStatus();
      return reply.send(status);
    } catch (err: any) {
      return reply.status(500).send({
        connected: false,
        status: 'DISCONNECTED',
        message: err?.message || 'فشل جلب حالة واتساب',
      });
    }
  };
  fastify.get('/whatsapp/status', getStatusHandler);
  fastify.get('/api/whatsapp/status', getStatusHandler);

  // 2. WhatsApp Pairing / Connect
  const connectHandler = async (request: any, reply: any) => {
    try {
      const status = await whatsappService.initSocket(true);
      return reply.send({
        status: status.status,
        connected: status.connected,
        user: status.user,
        userName: status.userName,
        message: status.connected
          ? 'جلسة واتساب متصلة ونشطة بالفعل'
          : 'افتح واتساب في هاتفك وامسح الرمز أدناه للربط',
        qrDataUrl: status.qr,
      });
    } catch (err: any) {
      return reply.status(500).send({
        status: 'DISCONNECTED',
        connected: false,
        message: err?.message || 'فشل بدء جلسة واتساب',
      });
    }
  };
  fastify.post('/whatsapp/connect', connectHandler);
  fastify.post('/api/whatsapp/connect', connectHandler);

  // 3. WhatsApp Disconnect / Logout
  const logoutHandler = async (request: any, reply: any) => {
    try {
      const result = await whatsappService.logout();
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        message: err?.message || 'فشل تسجيل الخروج من واتساب',
      });
    }
  };
  fastify.post('/whatsapp/logout', logoutHandler);
  fastify.post('/api/whatsapp/logout', logoutHandler);

  // 4. WhatsApp Direct Media Dispatch
  const sendMediaHandler = async (request: any, reply: any) => {
    const { phone, type, mediaBuffer, caption, fileName, mimetype } = request.body as SendMediaParams;

    if (!phone) {
      return reply.status(400).send({ message: 'رقم هاتف المريض مطلوب' });
    }
    if (!type || !['image', 'document'].includes(type)) {
      return reply.status(400).send({ message: 'نوع الوسائط غير صالح (يجب أن يكون image أو document)' });
    }
    if (!mediaBuffer) {
      return reply.status(400).send({ message: 'محتوى الوسائط (mediaBuffer) مطلوب' });
    }

    try {
      const result = await whatsappService.sendMedia({
        phone,
        type,
        mediaBuffer,
        caption,
        fileName,
        mimetype,
      });
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        message: err?.message || 'فشل إرسال الوسائط عبر واتساب',
      });
    }
  };
  fastify.post('/whatsapp/send-media', sendMediaHandler);
  fastify.post('/api/whatsapp/send-media', sendMediaHandler);

  // 5. Send Result to Patient via WhatsApp (Multi-form and Vector PDF Direct Dispatch)
  const sendResultHandler = async (request: any, reply: any) => {
    const { sampleId } = (request.params as { sampleId: string }) || {};
    const body = (request.body as any) || {};
    const targetSampleId = sampleId || body.sampleId;

    if (!targetSampleId) {
      return reply.status(400).send({ message: 'رقم العينة مطلوب' });
    }

    const sample = await prisma.sample.findUnique({
      where: { id: targetSampleId },
      include: {
        patient: true,
        tests: { include: { test: true } },
      },
    });

    if (!sample) {
      return reply.status(404).send({ message: 'العينة غير موجودة' });
    }

    const patientPhone = (body.phone || sample.patient?.phone || '').trim();
    const cleanPhone = cleanDisplayPhone(patientPhone);
    const targetJid = formatToWhatsAppJID(patientPhone);

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
      forms.push({
        section: 'general',
        titleArabic: 'الكيمياء السريرية والفحوصات الروتينية',
        title: 'الكيمياء السريرية والفحوصات الروتينية',
        count: generalTests.length,
        testCount: generalTests.length,
      });
    }
    if (cbcTests.length > 0) {
      forms.push({
        section: 'cbc',
        titleArabic: 'صورة الدم الكاملة (CBC)',
        title: 'صورة الدم الكاملة (CBC)',
        count: cbcTests.length,
        testCount: cbcTests.length,
      });
    }
    if (gueTests.length > 0) {
      forms.push({
        section: 'gue',
        titleArabic: 'الفحص العام للإدرار (G.U.E)',
        title: 'الفحص العام للإدرار (G.U.E)',
        count: gueTests.length,
        testCount: gueTests.length,
      });
    }
    if (gseTests.length > 0) {
      forms.push({
        section: 'gse',
        titleArabic: 'الفحص العام للخروج (G.S.E)',
        title: 'الفحص العام للخروج (G.S.E)',
        count: gseTests.length,
        testCount: gseTests.length,
      });
    }
    if (sfaTests.length > 0) {
      forms.push({
        section: 'sfa',
        titleArabic: 'فحص السائل المنوي (S.F.A)',
        title: 'فحص السائل المنوي (S.F.A)',
        count: sfaTests.length,
        testCount: sfaTests.length,
      });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    const currentLabName = settings?.labName || 'المختبر للتحليلات الطبية';

    // Official Clean Arabic Greeting Message (ZERO dead LAN URLs!)
    const greetingText = `السلام عليكم ورحمة الله وبركاته.\nالأخ/الأخت الفاضل(ة): ${sample.patient?.name || ''}\n\nيسر (${currentLabName}) إعلامكم بصدور نتائج تحاليلكم الطبية المعتمدة للعينة رقم (#${sample.sampleNumber}).\nمرفق لكم طياً التقرير الطبي المعتمد بصيغة (PDF).\n\nنتمنى لكم دوام الصحة والعافية!`;

    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greetingText)}` : null;

    // Handle Active Server Dispatch if requested
    if (body.autoSend === true) {
      const status = whatsappService.getStatus();
      if (!status.connected) {
        return reply.status(400).send({
          success: false,
          delivered: false,
          message: 'خادم واتساب غير متصل حالياً. يرجى مسح رمز الاستجابة السريعة (QR) من تبويب واتساب في الإعدادات لربط النظام أولاً.',
        });
      }

      if (!targetJid) {
        return reply.status(400).send({
          success: false,
          delivered: false,
          message: 'رقم هاتف المريض غير متوفر أو غير صالح للإرسال عبر واتساب.',
        });
      }

      try {
        // 1. Generate official vector PDF report
        const reportData: ReportData = {
          labName: currentLabName,
          labAddress: settings?.address || null,
          labPhone: settings?.phone || null,
          patientName: sample.patient?.name || 'مريض',
          patientAge: sample.patient?.age || null,
          patientGender: sample.patient?.gender || null,
          sampleNumber: sample.sampleNumber,
          sampleDate: sample.createdAt
            ? new Date(sample.createdAt).toLocaleDateString('ar-IQ')
            : new Date().toLocaleDateString('ar-IQ'),
          tests: tests.map((t: any) => ({
            testName: t.test?.name || t.test?.arabicName || 'فحص طبي',
            category: t.test?.category || 'عام',
            resultValue: String(t.resultValue || ''),
            unit: t.test?.unit || null,
            refRangeLow: t.test?.refRangeLow ?? null,
            refRangeHigh: t.test?.refRangeHigh ?? null,
            refRangeText: t.test?.refRangeText ?? null,
            isAbnormal: t.isAbnormal ?? false,
          })),
        };

        const pdfBuffer = await generateSampleReportPDF(reportData);

        // 2. Dispatch official PDF document directly via Baileys socket
        const pdfFileName = `Labryo_Report_${sample.sampleNumber}_${(sample.patient?.name || 'Patient').replace(/\s+/g, '_')}.pdf`;
        const sendPdfResult = await whatsappService.sendMedia({
          phone: targetJid,
          type: 'document',
          mediaBuffer: pdfBuffer,
          fileName: pdfFileName,
          caption: `📄 التقرير الطبي المعتمد بصيغة PDF - عينة #${sample.sampleNumber}\nالمريض: ${sample.patient?.name}\n${currentLabName}`,
        });

        // 3. Send official greeting text
        await whatsappService.sendTextMessage(targetJid, greetingText);

        // Update sample status to READY or DELIVERED if all results present
        await prisma.sample.update({
          where: { id: sample.id },
          data: {
            status: sample.status === 'READY' ? 'DELIVERED' : sample.status,
            deliveredAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          delivered: true,
          messageId: sendPdfResult.messageId,
          sampleId: sample.id,
          sampleNumber: sample.sampleNumber,
          patientName: sample.patient?.name,
          patientPhone,
          cleanPhone,
          totalForms: forms.length,
          message: `تم إرسال التقرير الطبي الرسمي (PDF) مباشرة إلى واتساب المريض (${cleanPhone}) بنجاح!`,
        });
      } catch (dispatchErr: any) {
        fastify.log.error(dispatchErr);
        return reply.status(500).send({
          success: false,
          delivered: false,
          message: dispatchErr?.message || 'فشل إرسال تقرير الواتساب إلى هاتف المريض',
        });
      }
    }

    // Default response: Return form catalog and greeting (without auto-send)
    return reply.send({
      success: true,
      delivered: false,
      sampleId: sample.id,
      sampleNumber: sample.sampleNumber,
      patientName: sample.patient?.name,
      patientPhone,
      cleanPhone,
      totalForms: forms.length,
      forms: forms.map((f, i) => ({
        ...f,
        caption: `📄 صورة (${i + 1}/${forms.length}): تقرير ${f.title} - عينة #${sample.sampleNumber}\nالمريض: ${sample.patient?.name}\n${currentLabName}`,
        imageUrl: `/api/samples/${sample.id}/image?section=${f.section}`,
      })),
      defaultGreeting: greetingText,
      waLink,
      message: `تم تجهيز بيانات الفحص الطبي للعينة #${sample.sampleNumber}`,
    });
  };

  fastify.post('/whatsapp/send-result/:sampleId', sendResultHandler);
  fastify.post('/api/whatsapp/send-result/:sampleId', sendResultHandler);
  fastify.post('/whatsapp/send-result', sendResultHandler);
  fastify.post('/api/whatsapp/send-result', sendResultHandler);
}
