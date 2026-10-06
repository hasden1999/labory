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

  // Get Catalog Tests directly
  fastify.get('/catalog/tests', async (request, reply) => {
    const tests = await prisma.testCatalog.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return reply.send(tests);
  });

  // Create Catalog Test
  fastify.post('/tests', async (request, reply) => {
    try {
      const data = request.body as any;

      if (!data.name || data.price === undefined) {
        return reply.status(400).send({ message: 'اسم الفحص والسعر مطلوبان' });
      }

      const trimmedName = data.name.trim();
      const existing = await prisma.testCatalog.findFirst({
        where: {
          OR: [
            ...(data.code && data.code.trim() ? [{ code: data.code.trim() }] : []),
            { name: { equals: trimmedName } },
          ],
          active: true
        },
      });

      if (existing) {
        return reply.status(409).send({
          message: `فحص بهذا الاسم أو الرمز موجود مسبقاً (${existing.name} - ${existing.code || ''})`,
          existingId: existing.id
        });
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
          specialtyId: data.specialtyId || null,
          groupId: data.groupId || null,
          sortOrder: data.sortOrder !== undefined && data.sortOrder !== null ? Number(data.sortOrder) : null,
        },
      });

      if (Array.isArray(data.referenceRanges) && data.referenceRanges.length > 0) {
        for (const rr of data.referenceRanges) {
          const rrId = rr.id || `rr_${test.id}_${rr.sortOrder || 0}`;
          await (prisma as any).referenceRange.upsert({
            where: { id: rrId },
            update: {
              label: rr.label || 'المعدل العام',
              sex: rr.sex || 'any',
              ageMin: rr.ageMin != null ? Number(rr.ageMin) : null,
              ageMax: rr.ageMax != null ? Number(rr.ageMax) : null,
              ageUnit: rr.ageUnit || 'years',
              low: rr.low != null ? Number(rr.low) : null,
              high: rr.high != null ? Number(rr.high) : null,
              text: rr.text || null,
              unit: rr.unit || null,
              note: rr.note || null,
              source: rr.source || null,
              sourceUrl: rr.sourceUrl || null,
              isUserEdited: Boolean(rr.isUserEdited),
              sortOrder: Number(rr.sortOrder || 0),
            },
            create: {
              id: rrId,
              testId: test.id,
              label: rr.label || 'المعدل العام',
              sex: rr.sex || 'any',
              ageMin: rr.ageMin != null ? Number(rr.ageMin) : null,
              ageMax: rr.ageMax != null ? Number(rr.ageMax) : null,
              ageUnit: rr.ageUnit || 'years',
              low: rr.low != null ? Number(rr.low) : null,
              high: rr.high != null ? Number(rr.high) : null,
              text: rr.text || null,
              unit: rr.unit || null,
              note: rr.note || null,
              source: rr.source || null,
              sourceUrl: rr.sourceUrl || null,
              isUserEdited: Boolean(rr.isUserEdited),
              sortOrder: Number(rr.sortOrder || 0),
            },
          }).catch((err: any) => console.warn('[Server Tests] Failed to create reference range:', err?.message));
        }
      }

      return reply.status(201).send(test);
    } catch (err: any) {
      console.error('[Server Tests] Create test error:', err);
      return reply.status(500).send({ message: err?.message || 'فشل إضافة الفحص إلى الكتالوج' });
    }
  });

  // Update Catalog Test Helper
  const handleUpdateTest = async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const existing = await prisma.testCatalog.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ message: 'الفحص غير موجود في الكتالوج' });
      }

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
          ...(data.specialtyId !== undefined ? { specialtyId: data.specialtyId || null } : {}),
          ...(data.groupId !== undefined ? { groupId: data.groupId || null } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder !== null && data.sortOrder !== undefined ? Number(data.sortOrder) : null } : {}),
        },
      });

      if (Array.isArray(data.referenceRanges)) {
        await (prisma as any).referenceRange.deleteMany({ where: { testId: id } }).catch(() => {});
        for (const rr of data.referenceRanges) {
          const rrId = rr.id || `rr_${id}_${rr.sortOrder || 0}`;
          await (prisma as any).referenceRange.create({
            data: {
              id: rrId,
              testId: id,
              label: rr.label || 'المعدل العام',
              sex: rr.sex || 'any',
              ageMin: rr.ageMin != null ? Number(rr.ageMin) : null,
              ageMax: rr.ageMax != null ? Number(rr.ageMax) : null,
              ageUnit: rr.ageUnit || 'years',
              low: rr.low != null ? Number(rr.low) : null,
              high: rr.high != null ? Number(rr.high) : null,
              text: rr.text || null,
              unit: rr.unit || null,
              note: rr.note || null,
              source: rr.source || null,
              sourceUrl: rr.sourceUrl || null,
              isUserEdited: Boolean(rr.isUserEdited),
              sortOrder: Number(rr.sortOrder || 0),
            },
          }).catch((err: any) => console.warn('[Server Tests] Failed to sync reference range:', err?.message));
        }
      }

      return reply.send(updated);
    } catch (err: any) {
      console.error('[Server Tests] Update test error:', err);
      return reply.status(500).send({ message: err?.message || 'فشل تعديل بيانات الفحص' });
    }
  };

  // Update Catalog Test (Support both PATCH and PUT)
  fastify.patch('/tests/:id', handleUpdateTest);
  fastify.put('/tests/:id', handleUpdateTest);

  // Delete Test (Soft-delete fallback if sample tests reference it)
  fastify.delete('/tests/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const sampleTestsCount = await prisma.sampleTest.count({ where: { testId: id } });
      if (sampleTestsCount > 0) {
        // Soft delete to protect clinical history
        await prisma.testCatalog.update({
          where: { id },
          data: { active: false },
        });
        return reply.send({ success: true, message: 'تم إيقاف تفعيل الفحص بنجاح وحفظ السجلات السريرية المرتبطة به' });
      }

      await prisma.testCatalog.delete({ where: { id } });
      return reply.send({ success: true, message: 'تم حذف الفحص بنجاح' });
    } catch (err: any) {
      console.error('[Server Tests] Delete test error:', err);
      return reply.status(500).send({ message: err?.message || 'فشل حذف الفحص من الكتالوج' });
    }
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

  // Batch convert test catalog prices according to currency
  fastify.post('/tests/convert-currency', async (request, reply) => {
    const { targetCurrency, rate } = request.body as any;
    const multiplier = Number(rate) || 1;

    if (multiplier > 0) {
      const tests = await prisma.testCatalog.findMany();
      for (const t of tests) {
        const newPrice = Math.round(t.price * multiplier);
        const newCost = t.costEstimate ? Math.round(t.costEstimate * multiplier) : t.costEstimate;
        await prisma.testCatalog.update({
          where: { id: t.id },
          data: { price: newPrice, costEstimate: newCost },
        });
      }

      const panels = await prisma.testPanel.findMany();
      for (const p of panels) {
        const newPrice = Math.round(p.price * multiplier);
        await prisma.testPanel.update({
          where: { id: p.id },
          data: { price: newPrice },
        });
      }

      if (targetCurrency) {
        await prisma.settings.upsert({
          where: { id: 'singleton' },
          update: { currency: targetCurrency },
          create: { id: 'singleton', currency: targetCurrency },
        });
      }
    }

    const updatedTests = await prisma.testCatalog.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    const updatedPanels = await prisma.testPanel.findMany();

    return reply.send({ success: true, tests: updatedTests, panels: updatedPanels });
  });
}
