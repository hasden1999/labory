import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.get('/expenses', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    return reply.send(expenses);
  });

  fastify.post('/expenses', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { description, amount, category, paymentMethod } = request.body as any;

    if (!description || amount === undefined || Number(amount) <= 0) {
      return reply.status(400).send({ message: 'وصف المصروف والمبلغ مطلوبة بشكل صحيح' });
    }

    const numAmount = Number(amount);
    const method = paymentMethod || 'نقداً';
    const cat = category || 'مصاريف تشغيلية';

    const result = await prisma.$transaction(async (tx) => {
      const lastTx = await tx.financialTransaction.findFirst({
        orderBy: { voucherNumber: 'desc' },
        select: { voucherNumber: true },
      });
      const voucherNum = (lastTx?.voucherNumber || 1000) + 1;

      const expense = await tx.expense.create({
        data: {
          voucherNumber: voucherNum,
          description: description.trim(),
          amount: numAmount,
          category: cat,
          paymentMethod: method,
        },
      });

      await tx.financialTransaction.create({
        data: {
          voucherNumber: voucherNum,
          type: 'EXPENSE',
          category: cat,
          amount: numAmount,
          paymentMethod: method,
          notes: description.trim(),
          createdById: (request.user as any)?.id || 'single_operator',
        },
      });

      return expense;
    });

    return reply.status(201).send(result);
  });

  fastify.delete('/expenses/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (existing) {
      await prisma.$transaction([
        prisma.expense.delete({ where: { id } }),
        ...(existing.voucherNumber
          ? [prisma.financialTransaction.deleteMany({ where: { voucherNumber: existing.voucherNumber, type: 'EXPENSE' } })]
          : []),
      ]);
    }
    return reply.send({ success: true, message: 'تم حذف سند المصروف' });
  });
}
