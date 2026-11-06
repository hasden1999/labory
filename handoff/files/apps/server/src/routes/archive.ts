import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function archiveRoutes(fastify: FastifyInstance) {
  // Get Patient Results for active 3 months or search across all records
  fastify.get('/archive/results', async (request, reply) => {
    const { query, period } = request.query as { query?: string; period?: string };

    // Calculate 90 days ago cutoff
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Build query for active samples
    const sampleWhere: any = {};

    if (query && query.trim()) {
      const q = query.trim();
      const num = parseInt(q, 10);

      sampleWhere.OR = [
        { patient: { name: { contains: q } } },
        { patient: { phone: { contains: q } } },
        ...(isNaN(num) ? [] : [{ sampleNumber: num }]),
      ];
    } else {
      // By default show active 3-month results
      sampleWhere.createdAt = { gte: ninetyDaysAgo };
    }

    const activeSamples = await prisma.sample.findMany({
      where: sampleWhere,
      include: {
        patient: true,
        doctor: true,
        tests: {
          include: { test: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Query archived records if searching or filtered by period
    const archiveWhere: any = {};
    if (query && query.trim()) {
      archiveWhere.patientName = { contains: query.trim() };
    }
    if (period) {
      archiveWhere.periodLabel = period;
    }

    const archivedRecords = await prisma.resultArchive.findMany({
      where: archiveWhere,
      orderBy: { archivedAt: 'desc' },
      take: 100,
    });

    // Parse JSON for archived records (supporting legacy array format and rich snapshot format)
    const formattedArchived = archivedRecords.map((ar) => {
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(ar.resultsJson || '[]');
      } catch {
        parsedJson = [];
      }

      const testsParsed = Array.isArray(parsedJson) ? parsedJson : (parsedJson?.testResults || []);
      const sampleSnapshot = !Array.isArray(parsedJson) ? parsedJson?.sampleSnapshot : null;

      return {
        ...ar,
        testsParsed,
        sampleSnapshot,
      };
    });

    return {
      activeResults: activeSamples,
      archivedResults: formattedArchived,
      cutoffDate: ninetyDaysAgo,
    };
  });

  // Trigger 3-Month Auto-Archiving Partition
  fastify.post('/archive/trigger', async (request, reply) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find samples older than 90 days with complete relational snapshot
    const oldSamples = await prisma.sample.findMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
      include: {
        patient: true,
        doctor: true,
        tests: {
          include: { test: true },
        },
      },
    });

    if (oldSamples.length === 0) {
      return { message: 'لا توجد نتائج أقدم من 3 أشهر لطلب الأرشفة.', archivedCount: 0 };
    }

    let archivedCount = 0;

    for (const sample of oldSamples) {
      const date = new Date(sample.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      const periodLabel = `Q${quarter} ${year} (الربع ${quarter})`;

      const testSummary = sample.tests.map((t) => t.test?.name || 'فحص').join(', ');

      const testResults = sample.tests.map((t) => ({
        testId: t.testId,
        testName: t.test?.name || 'فحص',
        result: t.resultValue || 'غير محدد',
        resultValue: t.resultValue,
        unit: t.unit,
        isAbnormal: t.isAbnormal,
        isCritical: t.isCritical,
        refRange: t.refRangeText,
        refRangeText: t.refRangeText,
        refRangeLow: t.refRangeLow,
        refRangeHigh: t.refRangeHigh,
        notes: t.notes,
        interpretation: t.interpretation,
        technicianNotes: t.technicianNotes,
        crystals: t.crystals,
        priceAtTime: t.priceAtTime,
        costAtTime: t.costAtTime,
      }));

      // Preserve rich comprehensive snapshot of sample, financials, doctor, and metadata
      const sampleSnapshot = {
        sampleNumber: sample.sampleNumber,
        patientId: sample.patientId,
        patientName: sample.patient?.name,
        patientPhone: sample.patient?.phone,
        patientAge: sample.patient?.age,
        patientGender: sample.patient?.gender,
        doctorId: sample.doctorId,
        doctorName: sample.doctor?.name,
        doctorClinic: sample.doctor?.clinic,
        doctorPhone: sample.doctor?.phone,
        status: sample.status,
        isUrgent: sample.isUrgent,
        priceTotal: sample.priceTotal,
        discount: sample.discount,
        discountPercent: sample.discountPercent,
        paidAmount: sample.paidAmount,
        remainingAmount: sample.remainingAmount,
        paymentMethod: sample.paymentMethod,
        notes: sample.notes,
        createdById: sample.createdById,
        collectionTime: sample.collectionTime,
        deliveredAt: sample.deliveredAt,
        createdAt: sample.createdAt,
        tests: sample.tests.map((t) => ({
          testId: t.testId,
          testName: t.test?.name,
          resultValue: t.resultValue,
          notes: t.notes,
          isAbnormal: t.isAbnormal,
          isCritical: t.isCritical,
          interpretation: t.interpretation,
          technicianNotes: t.technicianNotes,
          crystals: t.crystals,
          priceAtTime: t.priceAtTime,
          costAtTime: t.costAtTime,
          refRangeLow: t.refRangeLow,
          refRangeHigh: t.refRangeHigh,
          refRangeText: t.refRangeText,
          unit: t.unit,
        })),
      };

      const resultsJson = JSON.stringify({
        testResults,
        sampleSnapshot,
      });

      await prisma.$transaction(async (tx) => {
        await tx.resultArchive.create({
          data: {
            periodLabel,
            quarter,
            year,
            patientName: sample.patient?.name || 'مريض غير مسجل',
            sampleNum: sample.sampleNumber,
            testSummary,
            resultsJson,
            sampleDate: sample.createdAt,
          },
        });

        // Delete active sample record once preserved in archive
        await tx.sample.delete({ where: { id: sample.id } });
      });

      archivedCount++;
    }

    return {
      message: `تم أرشفة ${archivedCount} نتيجة مريض بنجاح وفتح ملف جديد للخزن.`,
      archivedCount,
    };
  });

  // Restore Archived Sample to Active Sample Table
  fastify.post('/archive/restore/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const archiveRecord = await prisma.resultArchive.findUnique({
      where: { id },
    });

    if (!archiveRecord) {
      return reply.status(404).send({ success: false, message: 'سجل الأرشيف غير موجود' });
    }

    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(archiveRecord.resultsJson || '[]');
    } catch {
      parsedJson = [];
    }

    const snapshot = !Array.isArray(parsedJson) ? parsedJson?.sampleSnapshot : null;
    const tests = Array.isArray(parsedJson) ? parsedJson : (parsedJson?.testResults || snapshot?.tests || []);

    // 1. Resolve Patient
    let patientId = snapshot?.patientId;
    if (patientId) {
      const existingPatient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!existingPatient) {
        patientId = null;
      }
    }
    if (!patientId) {
      let foundPatient = await prisma.patient.findFirst({
        where: { name: archiveRecord.patientName },
      });
      if (!foundPatient) {
        foundPatient = await prisma.patient.create({
          data: {
            name: archiveRecord.patientName,
            phone: snapshot?.patientPhone || null,
            age: snapshot?.patientAge || null,
            gender: snapshot?.patientGender || null,
          },
        });
      }
      patientId = foundPatient.id;
    }

    // 2. Resolve Doctor
    let doctorId = snapshot?.doctorId || null;
    if (doctorId) {
      const existingDoc = await prisma.referringDoctor.findUnique({ where: { id: doctorId } });
      if (!existingDoc) {
        doctorId = null;
      }
    }

    // 3. Resolve Unique Sample Number
    let targetSampleNumber = archiveRecord.sampleNum;
    const conflictingSample = await prisma.sample.findUnique({
      where: { sampleNumber: targetSampleNumber },
    });
    if (conflictingSample) {
      const maxSample = await prisma.sample.findFirst({
        orderBy: { sampleNumber: 'desc' },
        select: { sampleNumber: true },
      });
      targetSampleNumber = (maxSample?.sampleNumber || 1000) + 1;
    }

    // 4. Default Catalog Fallback for old/unmapped tests
    const defaultCatalog = await prisma.testCatalog.findFirst();

    // 5. Atomic Restoration Transaction
    const restored = await prisma.$transaction(async (tx) => {
      const newSample = await tx.sample.create({
        data: {
          sampleNumber: targetSampleNumber,
          patientId: patientId!,
          doctorId,
          status: snapshot?.status || 'READY',
          isUrgent: snapshot?.isUrgent || false,
          priceTotal: typeof snapshot?.priceTotal === 'number' ? snapshot.priceTotal : 0,
          discount: typeof snapshot?.discount === 'number' ? snapshot.discount : 0,
          discountPercent: typeof snapshot?.discountPercent === 'number' ? snapshot.discountPercent : 0,
          paidAmount: typeof snapshot?.paidAmount === 'number' ? snapshot.paidAmount : 0,
          remainingAmount: typeof snapshot?.remainingAmount === 'number' ? snapshot.remainingAmount : 0,
          paymentMethod: snapshot?.paymentMethod || 'نقداً',
          notes: snapshot?.notes || `مسترجعة من الأرشيف (${archiveRecord.periodLabel})`,
          createdById: snapshot?.createdById || 'single_operator',
          collectionTime: snapshot?.collectionTime ? new Date(snapshot.collectionTime) : new Date(archiveRecord.sampleDate),
          deliveredAt: snapshot?.deliveredAt ? new Date(snapshot.deliveredAt) : null,
          createdAt: snapshot?.createdAt ? new Date(snapshot.createdAt) : new Date(archiveRecord.sampleDate),
        },
      });

      for (const t of tests) {
        let testCatalogId = t.testId;
        if (testCatalogId) {
          const exists = await tx.testCatalog.findUnique({ where: { id: testCatalogId } });
          if (!exists) testCatalogId = null;
        }
        if (!testCatalogId && t.testName) {
          const match = await tx.testCatalog.findFirst({
            where: {
              OR: [
                { name: { equals: t.testName } },
                { arabicName: { equals: t.testName } },
              ],
            },
          });
          if (match) testCatalogId = match.id;
        }
        if (!testCatalogId) {
          testCatalogId = defaultCatalog?.id;
        }

        if (testCatalogId) {
          await tx.sampleTest.create({
            data: {
              sampleId: newSample.id,
              testId: testCatalogId,
              resultValue: t.resultValue || t.result || null,
              notes: t.notes || null,
              isAbnormal: typeof t.isAbnormal === 'boolean' ? t.isAbnormal : false,
              isCritical: typeof t.isCritical === 'boolean' ? t.isCritical : false,
              interpretation: t.interpretation || null,
              technicianNotes: t.technicianNotes || null,
              crystals: t.crystals || null,
              priceAtTime: typeof t.priceAtTime === 'number' ? t.priceAtTime : 0,
              costAtTime: typeof t.costAtTime === 'number' ? t.costAtTime : 0,
              refRangeLow: typeof t.refRangeLow === 'number' ? t.refRangeLow : null,
              refRangeHigh: typeof t.refRangeHigh === 'number' ? t.refRangeHigh : null,
              refRangeText: t.refRangeText || t.refRange || null,
              unit: t.unit || null,
            },
          });
        }
      }

      // Delete archive record once successfully restored
      await tx.resultArchive.delete({
        where: { id },
      });

      return newSample;
    });

    return reply.send({
      success: true,
      message: `تم استعادة العينة #${restored.sampleNumber} بنجاح إلى السجلات النشطة وإلغاء أرشفتها.`,
      sample: restored,
    });
  });

  // Get list of archived periods
  fastify.get('/archive/periods', async (request, reply) => {
    const periods = await prisma.resultArchive.groupBy({
      by: ['periodLabel', 'quarter', 'year'],
      _count: { id: true },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });

    return periods;
  });
}
