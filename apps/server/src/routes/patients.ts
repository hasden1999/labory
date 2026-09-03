import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function patientRoutes(fastify: FastifyInstance) {
  // Fast Search Autocomplete for Patients
  fastify.get('/patients/search', async (request, reply) => {
    const { q, query } = request.query as { q?: string; query?: string };
    const searchTerm = q || query || '';

    if (!searchTerm.trim()) {
      const recentPatients = await prisma.patient.findMany({
        where: { isDeleted: false },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { samples: true } },
        },
      });
      return reply.send(recentPatients);
    }

    const patients = await prisma.patient.findMany({
      where: {
        isDeleted: false,
        OR: [
          { name: { contains: searchTerm.trim() } },
          { phone: { contains: searchTerm.trim() } },
        ],
      },
      include: {
        _count: { select: { samples: true } },
      },
      take: 20,
    });

    return reply.send(patients);
  });

  // Search or List Patients
  fastify.get('/patients', async (request, reply) => {
    const { query } = request.query as { query?: string };

    const whereClause: any = { isDeleted: false };
    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        samples: {
          orderBy: { createdAt: 'desc' },
          include: {
            tests: { include: { test: true } },
            doctor: true,
          },
        },
      },
    });

    return reply.send(patients);
  });

  // Get Single Patient with Full History
  fastify.get('/patients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        samples: {
          orderBy: { createdAt: 'desc' },
          include: {
            tests: { include: { test: true } },
            doctor: true,
          },
        },
      },
    });

    if (!patient) {
      return reply.status(404).send({ message: 'المريض غير موجود' });
    }

    return reply.send(patient);
  });

  // Get Patient Delta Check History
  fastify.get('/patients/:id/history', async (request, reply) => {
    const { id } = request.params as { id: string };

    const samples = await prisma.sample.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        tests: { include: { test: true } },
      },
    });

    const historyItems: any[] = [];
    samples.forEach((s) => {
      s.tests.forEach((st) => {
        historyItems.push({
          sampleId: s.id,
          sampleNumber: s.sampleNumber,
          date: s.createdAt,
          testName: st.test.name,
          arabicName: st.test.arabicName,
          resultValue: st.resultValue,
          unit: st.test.unit,
          isAbnormal: st.isAbnormal,
          isCritical: st.isCritical,
        });
      });
    });

    return reply.send(historyItems);
  });

  // Create Patient
  fastify.post('/patients', async (request, reply) => {
    const { name, phone, age, gender } = request.body as any;

    if (!name) {
      return reply.status(400).send({ message: 'اسم المريض مطلوب' });
    }

    const patient = await prisma.patient.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        age: age ? Number(age) : null,
        gender: gender || 'ذكر',
      },
    });

    return reply.status(201).send(patient);
  });

  // Update Patient Details
  fastify.patch('/patients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, phone, age, gender } = request.body as any;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'المريض غير موجود' });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(age !== undefined ? { age: age ? Number(age) : null } : {}),
        ...(gender ? { gender } : {}),
      },
    });

    return reply.send(updated);
  });

  fastify.put('/patients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, phone, age, gender } = request.body as any;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: name?.trim(),
        phone: phone || null,
        age: age ? Number(age) : null,
        gender: gender || 'ذكر',
      },
    });

    return reply.send(updated);
  });

  // Soft Delete Patient with Audit Trail
  fastify.delete('/patients/:id', async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'المريض غير موجود' });
    }
    await prisma.patient.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'PATIENT',
        entityId: id,
        details: `حذف ناعم لسجل المريض: ${existing.name}`,
        userName: request.user?.name || 'المشغل',
      },
    });
    return reply.send({ success: true, message: 'تم أرشفة وحذف سجل المريض بنجاح مع الحفاظ على سلامة البيانات السريرية' });
  });

  // Restore Soft-Deleted Patient
  fastify.post('/patients/:id/restore', async (request: any, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'المريض غير موجود' });
    }
    const restored = await prisma.patient.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });
    await prisma.auditLog.create({
      data: {
        action: 'RESTORE',
        entity: 'PATIENT',
        entityId: id,
        details: `استعادة سجل المريض المؤرشف: ${existing.name}`,
        userName: request.user?.name || 'المشغل',
      },
    });
    return reply.send({ success: true, patient: restored, message: 'تمت استعادة سجل المريض بنجاح' });
  });
}
