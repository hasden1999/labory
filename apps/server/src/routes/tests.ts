import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function testCatalogRoutes(fastify: FastifyInstance) {
  // Get Catalog Tests & Panels
  fastify.get('/tests', async (request, reply) => {
    const tests = await prisma.testCatalog.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const panels = await prisma.testPanel.findMany({
      include: {
        items: {
          include: { test: true },
        },
      },
    });

    return reply.send({ tests, panels });
  });

  // Create Catalog Test
  fastify.post('/tests', async (request, reply) => {
    const data = request.body as any;

    if (!data.name || data.price === undefined) {
      return reply.status(400).send({ message: 'اسم الفحص والسعر مطلوبان' });
    }

    const test = await prisma.testCatalog.create({
      data: {
        code: data.code || null,
        name: data.name,
        arabicName: data.arabicName || null,
        category: data.category || 'عام',
        price: Number(data.price),
        costEstimate: data.costEstimate ? Number(data.costEstimate) : 0,
        refRangeLow: data.refRangeLow !== undefined && data.refRangeLow !== '' ? Number(data.refRangeLow) : null,
        refRangeHigh: data.refRangeHigh !== undefined && data.refRangeHigh !== '' ? Number(data.refRangeHigh) : null,
        normalMaleLow: data.normalMaleLow !== undefined && data.normalMaleLow !== '' ? Number(data.normalMaleLow) : null,
        normalMaleHigh: data.normalMaleHigh !== undefined && data.normalMaleHigh !== '' ? Number(data.normalMaleHigh) : null,
        normalFemaleLow: data.normalFemaleLow !== undefined && data.normalFemaleLow !== '' ? Number(data.normalFemaleLow) : null,
        normalFemaleHigh: data.normalFemaleHigh !== undefined && data.normalFemaleHigh !== '' ? Number(data.normalFemaleHigh) : null,
        criticalLow: data.criticalLow !== undefined && data.criticalLow !== '' ? Number(data.criticalLow) : null,
        criticalHigh: data.criticalHigh !== undefined && data.criticalHigh !== '' ? Number(data.criticalHigh) : null,
        refRangeText: data.refRangeText || null,
        unit: data.unit || null,
        sampleType: data.sampleType || 'مصل الدم (Serum)',
      },
    });

    return reply.status(201).send(test);
  });

  // Update Catalog Test
  fastify.patch('/tests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const updated = await prisma.testCatalog.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.arabicName !== undefined ? { arabicName: data.arabicName } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.price !== undefined ? { price: Number(data.price) } : {}),
        ...(data.costEstimate !== undefined ? { costEstimate: Number(data.costEstimate) } : {}),
        ...(data.refRangeLow !== undefined ? { refRangeLow: data.refRangeLow !== '' ? Number(data.refRangeLow) : null } : {}),
        ...(data.refRangeHigh !== undefined ? { refRangeHigh: data.refRangeHigh !== '' ? Number(data.refRangeHigh) : null } : {}),
        ...(data.normalMaleLow !== undefined ? { normalMaleLow: data.normalMaleLow !== '' ? Number(data.normalMaleLow) : null } : {}),
        ...(data.normalMaleHigh !== undefined ? { normalMaleHigh: data.normalMaleHigh !== '' ? Number(data.normalMaleHigh) : null } : {}),
        ...(data.normalFemaleLow !== undefined ? { normalFemaleLow: data.normalFemaleLow !== '' ? Number(data.normalFemaleLow) : null } : {}),
        ...(data.normalFemaleHigh !== undefined ? { normalFemaleHigh: data.normalFemaleHigh !== '' ? Number(data.normalFemaleHigh) : null } : {}),
        ...(data.criticalLow !== undefined ? { criticalLow: data.criticalLow !== '' ? Number(data.criticalLow) : null } : {}),
        ...(data.criticalHigh !== undefined ? { criticalHigh: data.criticalHigh !== '' ? Number(data.criticalHigh) : null } : {}),
        ...(data.refRangeText !== undefined ? { refRangeText: data.refRangeText } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.sampleType !== undefined ? { sampleType: data.sampleType } : {}),
        ...(data.active !== undefined ? { active: Boolean(data.active) } : {}),
      },
    });

    return reply.send(updated);
  });

  // Delete Test
  fastify.delete('/tests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.testCatalog.delete({ where: { id } });
    return reply.send({ success: true, message: 'تم حذف الفحص بنجاح' });
  });

  // Helper function for panel creation
  const handleCreatePanel = async (request: any, reply: any) => {
    const { name, description, price, testIds } = request.body as any;

    if (!name || price === undefined || !testIds || !Array.isArray(testIds)) {
      return reply.status(400).send({ message: 'اسم المجموعة والسعر والفحوصات مطلوبة' });
    }

    const panel = await prisma.testPanel.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        items: {
          create: testIds.map((tId: string) => ({ testId: tId })),
        },
      },
      include: {
        items: { include: { test: true } },
      },
    });

    return reply.status(201).send(panel);
  };

  fastify.post('/panels', handleCreatePanel);
  fastify.post('/tests/panels', handleCreatePanel);

  // Helper function for panel update
  const handleUpdatePanel = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const { name, description, price, testIds } = request.body as any;

    if (!name || price === undefined) {
      return reply.status(400).send({ message: 'اسم الباقة والسعر مطلوبان' });
    }

    if (testIds && Array.isArray(testIds)) {
      await prisma.testPanelItem.deleteMany({ where: { panelId: id } });
      await prisma.testPanelItem.createMany({
        data: testIds.map((tId: string) => ({ panelId: id, testId: tId })),
      });
    }

    const updated = await prisma.testPanel.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: Number(price),
      },
      include: {
        items: { include: { test: true } },
      },
    });

    return reply.send(updated);
  };

  fastify.put('/panels/:id', handleUpdatePanel);
  fastify.patch('/panels/:id', handleUpdatePanel);
  fastify.put('/tests/panels/:id', handleUpdatePanel);
  fastify.patch('/tests/panels/:id', handleUpdatePanel);

  // Helper function for panel deletion
  const handleDeletePanel = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    await prisma.testPanelItem.deleteMany({ where: { panelId: id } });
    await prisma.testPanel.delete({ where: { id } });
    return reply.send({ success: true, message: 'تم حذف الباقة بنجاح' });
  };

  fastify.delete('/panels/:id', handleDeletePanel);
  fastify.delete('/tests/panels/:id', handleDeletePanel);
}
