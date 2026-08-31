import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get('/inventory', async (request, reply) => {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const itemsWithStatus = items.map((item) => {
      let expiryStatus = 'VALID'; // VALID, EXPIRING_SOON, EXPIRED
      let daysUntilExpiry: number | null = null;

      if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        daysUntilExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (exp < now) {
          expiryStatus = 'EXPIRED';
        } else if (exp <= thirtyDaysLater) {
          expiryStatus = 'EXPIRING_SOON';
        }
      }

      const isLowStock = item.quantity <= item.reorderThreshold;

      return {
        ...item,
        expiryStatus,
        daysUntilExpiry,
        isLowStock,
      };
    });

    return reply.send(itemsWithStatus);
  });

  fastify.get('/inventory/alerts', async (request, reply) => {
    const allItems = await prisma.inventoryItem.findMany();
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiredItems = allItems.filter((i) => i.expiryDate && new Date(i.expiryDate) < now);
    const expiringSoonItems = allItems.filter(
      (i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= thirtyDaysLater
    );
    const lowStockItems = allItems.filter((i) => i.quantity <= i.reorderThreshold);

    return reply.send({
      expiredCount: expiredItems.length,
      expiringSoonCount: expiringSoonItems.length,
      lowStockCount: lowStockItems.length,
      expiredItems,
      expiringSoonItems,
      lowStockItems,
    });
  });

  fastify.post('/inventory', async (request, reply) => {
    const { name, unit, quantity, reorderThreshold, expiryDate, supplier, costPerUnit } = request.body as any;

    if (!name || !unit || quantity === undefined || reorderThreshold === undefined || costPerUnit === undefined) {
      return reply.status(400).send({ message: 'جميع الحقول الأساسية للمخزون مطلوبة' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        unit,
        quantity: Number(quantity),
        reorderThreshold: Number(reorderThreshold),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier: supplier || null,
        costPerUnit: Number(costPerUnit),
      },
    });

    return reply.status(201).send(item);
  });

  fastify.patch('/inventory/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { quantity, deltaQuantity, reorderThreshold, expiryDate, costPerUnit, name, unit, supplier } = request.body as any;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'عنصر المخزون غير موجود' });
    }

    let newQuantity = existing.quantity;
    if (quantity !== undefined) {
      newQuantity = Number(quantity);
    } else if (deltaQuantity !== undefined) {
      newQuantity = existing.quantity + Number(deltaQuantity);
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(unit ? { unit } : {}),
        ...(supplier !== undefined ? { supplier } : {}),
        quantity: newQuantity,
        reorderThreshold: reorderThreshold !== undefined ? Number(reorderThreshold) : existing.reorderThreshold,
        expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
        costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : existing.costPerUnit,
      },
    });

    if (deltaQuantity !== undefined && deltaQuantity !== 0) {
      await prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          type: deltaQuantity > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(Number(deltaQuantity)),
        },
      });
    }

    return reply.send(updated);
  });

  fastify.delete('/inventory/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.inventoryItem.delete({ where: { id } });
    return reply.send({ success: true, message: 'تم حذف عنصر المخزون بنجاح' });
  });
}
