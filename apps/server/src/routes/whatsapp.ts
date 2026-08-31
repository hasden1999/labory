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

  // Send Result to Patient via WhatsApp
  fastify.post('/whatsapp/send-result/:sampleId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { sampleId } = request.params as { sampleId: string };

    return reply.send({
      success: true,
      message: `تمت محاكاة إرسال النتيجة للعينة ${sampleId} عبر واتساب بنجاح!`,
    });
  });
}
