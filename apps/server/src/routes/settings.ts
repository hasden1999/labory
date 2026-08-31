import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/settings', async (request, reply) => {
    const settings = (await prisma.settings.findUnique({ where: { id: 'singleton' } })) || {
      labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
      labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل ومعتمد',
      doctorName: 'د. أحمد الرضا',
      doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
      labLicense: 'MOH-IQ-2026-8842',
      whatsappNumber: '07701234567',
      currency: 'د.ع',
      address: 'بغداد - شارع الأطباء - مقابل المجمع الطبي الرئيسي',
      phone: '07701234567 / 07801234567',
      reportHeader: 'مختبر الرضا للتحليلات الطبية التخصصية',
      reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً دون الحاجة لتوقيع يدوي.',
      reportTemplate: 'CLASSIC',
      logoPath: null,
    };
    return reply.send(settings);
  });

  fastify.post('/settings', async (request, reply) => {
    const {
      labName,
      labSubtitle,
      doctorName,
      doctorTitle,
      labLicense,
      whatsappNumber,
      currency,
      address,
      phone,
      reportHeader,
      reportFooter,
      reportTemplate,
      logoPath,
    } = request.body as any;

    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        ...(labName !== undefined ? { labName } : {}),
        ...(labSubtitle !== undefined ? { labSubtitle } : {}),
        ...(doctorName !== undefined ? { doctorName } : {}),
        ...(doctorTitle !== undefined ? { doctorTitle } : {}),
        ...(labLicense !== undefined ? { labLicense } : {}),
        ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
        ...(currency !== undefined ? { currency } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(reportHeader !== undefined ? { reportHeader } : {}),
        ...(reportFooter !== undefined ? { reportFooter } : {}),
        ...(reportTemplate !== undefined ? { reportTemplate } : {}),
        ...(logoPath !== undefined ? { logoPath } : {}),
      },
      create: {
        id: 'singleton',
        labName: labName || 'مختبر الرضا للتحليلات الطبية التخصصية',
        labSubtitle: labSubtitle || 'فحوصات مرضية وتطبيقية دقيقة',
        doctorName: doctorName || 'د. أحمد الرضا',
        doctorTitle: doctorTitle || 'استشاري التحليلات المرضية',
        labLicense: labLicense || 'MOH-IQ-2026-8842',
        whatsappNumber: whatsappNumber || '07701234567',
        currency: currency || 'د.ع',
        address: address || 'بغداد - شارع الأطباء',
        phone: phone || '07700000000',
        reportHeader: reportHeader || 'مختبر الرضا للتحليلات الطبية التخصصية',
        reportFooter: reportFooter || 'النتائج صادرة إلكترونياً ومطابقة للمواصفات المختبرية الدولية.',
        reportTemplate: reportTemplate || 'CLASSIC',
        logoPath: logoPath || null,
      },
    });

    return reply.send(settings);
  });
}
