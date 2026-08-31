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

    // Parse JSON for archived records
    const formattedArchived = archivedRecords.map((ar) => ({
      ...ar,
      testsParsed: JSON.parse(ar.resultsJson || '[]'),
    }));

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

    // Find samples older than 90 days
    const oldSamples = await prisma.sample.findMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
      include: {
        patient: true,
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
      const resultsJson = JSON.stringify(
        sample.tests.map((t) => ({
          testName: t.test?.name,
          result: t.resultValue || 'غير محدد',
          unit: t.unit,
          isAbnormal: t.isAbnormal,
          refRange: t.refRangeText,
        }))
      );

      await prisma.resultArchive.create({
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

      // Delete archived sample to keep active storage fresh
      await prisma.sample.delete({ where: { id: sample.id } });
      archivedCount++;
    }

    return {
      message: `تم أرشفة ${archivedCount} نتيجة مريض بنجاح وفتح ملف جديد للخزن.`,
      archivedCount,
    };
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
