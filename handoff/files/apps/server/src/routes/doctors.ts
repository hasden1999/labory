import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function doctorRoutes(fastify: FastifyInstance) {
  fastify.get('/doctors', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const doctors = await prisma.referringDoctor.findMany({
      include: {
        samples: {
          select: {
            id: true,
            sampleNumber: true,
            priceTotal: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const doctorsWithStats = doctors.map((doc) => {
      const totalRevenue = doc.samples.reduce((acc, s) => acc + s.priceTotal, 0);
      const totalCommission = (totalRevenue * doc.commissionPercent) / 100;
      return {
        ...doc,
        samplesCount: doc.samples.length,
        totalRevenue,
        totalCommission,
      };
    });

    return reply.send(doctorsWithStats);
  });

  fastify.post('/doctors', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { name, phone, clinic, specialty, commissionPercent } = request.body as any;

    if (!name) {
      return reply.status(400).send({ message: 'اسم الطبيب مطلوب' });
    }

    const doctor = await prisma.referringDoctor.create({
      data: {
        name,
        phone: phone || null,
        clinic: clinic || null,
        specialty: specialty || null,
        commissionPercent: commissionPercent ? Number(commissionPercent) : 0,
      },
    });

    return reply.status(201).send(doctor);
  });

  fastify.patch('/doctors/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, phone, clinic, specialty, commissionPercent } = request.body as any;

    const updated = await prisma.referringDoctor.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(clinic !== undefined ? { clinic } : {}),
        ...(specialty !== undefined ? { specialty } : {}),
        ...(commissionPercent !== undefined ? { commissionPercent: Number(commissionPercent) } : {}),
      },
    });

    return reply.send(updated);
  });

  fastify.delete('/doctors/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Prevent destructive deletion if doctor has associated medical/financial sample records
    const sampleCount = await prisma.sample.count({
      where: { doctorId: id },
    });

    if (sampleCount > 0) {
      return reply.status(400).send({
        success: false,
        message: `لا يمكن حذف هذا الطبيب لوجود (${sampleCount}) سجلات طبية ومالية مرتبطة به في النظام. يرجى تعديل بياناته أو أرشفته بدلاً من الحذف لتجنب تضارب السجلات.`,
      });
    }

    await prisma.referringDoctor.delete({
      where: { id },
    });

    return reply.send({ success: true, message: 'تم حذف الطبيب بنجاح' });
  });
}
