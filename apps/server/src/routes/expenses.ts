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
    const { description, amount, category } = request.body as any;

    if (!description || amount === undefined) {
      return reply.status(400).send({ message: 'وصف المصروف والمبلغ مطلوبة' });
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: Number(amount),
        category: category || 'مصاريف تشغيلية',
      },
    });

    return reply.status(201).send(expense);
  });

  fastify.delete('/expenses/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.expense.delete({ where: { id } });
    return reply.send({ success: true, message: 'تم حذف المصروف' });
  });
}
