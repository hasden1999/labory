import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function debtRoutes(fastify: FastifyInstance) {
  // Get all debtors with aggregated balance
  fastify.get('/debts', async (request, reply) => {
    const debtors = await prisma.debtor.findMany({
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const debtorSummaries = debtors.map((d) => {
      let totalDebt = 0;
      let totalPaid = 0;

      d.transactions.forEach((tx) => {
        if (tx.type === 'DEBT') totalDebt += tx.amount;
        if (tx.type === 'PAYMENT') totalPaid += tx.amount;
      });

      const remainingBalance = Math.max(0, totalDebt - totalPaid);

      return {
        id: d.id,
        name: d.name,
        phone: d.phone,
        notes: d.notes,
        createdAt: d.createdAt,
        totalDebt,
        totalPaid,
        remainingBalance,
        lastTransaction: d.transactions[0] || null,
        transactionCount: d.transactions.length,
      };
    });

    return debtorSummaries;
  });

  // Create a new debtor
  fastify.post('/debts', async (request, reply) => {
    const { name, phone, notes, initialDebt } = request.body as {
      name: string;
      phone?: string;
      notes?: string;
      initialDebt?: number;
    };

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'اسم الشخص مطلوب' });
    }

    const debtor = await prisma.debtor.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        notes: notes || null,
        transactions: initialDebt && initialDebt > 0 ? {
          create: [{
            type: 'DEBT',
            amount: initialDebt,
            notes: 'رصيد دَيْن افتتاحي عند التسجيل',
          }],
        } : undefined,
      },
      include: {
        transactions: true,
      },
    });

    return debtor;
  });

  // Record a transaction (DEBT or PAYMENT) for a debtor
  fastify.post('/debts/:id/transaction', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { type, amount, notes, sampleId } = request.body as {
      type: 'DEBT' | 'PAYMENT';
      amount: number;
      notes?: string;
      sampleId?: string;
    };

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: 'مبلغ العملية يجب أن يكون أكبر من صفر' });
    }

    if (type !== 'DEBT' && type !== 'PAYMENT') {
      return reply.code(400).send({ error: 'نوع العملية غير صالح' });
    }

    const debtor = await prisma.debtor.findUnique({ where: { id } });
    if (!debtor) {
      return reply.code(404).send({ error: 'الشخص غير موجود' });
    }

    const tx = await prisma.debtRecord.create({
      data: {
        debtorId: id,
        sampleId: sampleId || null,
        type,
        amount,
        notes: notes || (type === 'PAYMENT' ? 'استلام دفعة مالية' : 'إضافة دَيْن مالي'),
      },
    });

    return tx;
  });

  // Get detailed statement for a specific debtor
  fastify.get('/debts/:id/statement', async (request, reply) => {
    const { id } = request.params as { id: string };

    const debtor = await prisma.debtor.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            sample: {
              include: { patient: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!debtor) {
      return reply.code(404).send({ error: 'الشخص غير موجود' });
    }

    let totalDebt = 0;
    let totalPaid = 0;
    debtor.transactions.forEach((tx) => {
      if (tx.type === 'DEBT') totalDebt += tx.amount;
      if (tx.type === 'PAYMENT') totalPaid += tx.amount;
    });

    return {
      debtor,
      summary: {
        totalDebt,
        totalPaid,
        remainingBalance: Math.max(0, totalDebt - totalPaid),
      },
    };
  });
}
