import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get('/inventory', async (request, reply) => {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    const now = new Date();

    const itemsWithStatus = items.map((item) => {
      let expiryStatus: 'NORMAL' | 'APPROACHING_EXPIRY' | 'EXPIRED' = 'NORMAL';
      let effectiveExpiry: Date | null = item.expiryDate ? new Date(item.expiryDate) : null;
      let daysUntilExpiry: number | null = null;
      const thresholdDays = item.alertThresholdDays || 30;

      // Smart Open-Vial stability calculation
      if (item.openedAt && item.openVialDays) {
        const openExpiry = new Date(new Date(item.openedAt).getTime() + item.openVialDays * 24 * 60 * 60 * 1000);
        if (!effectiveExpiry || openExpiry < effectiveExpiry) {
          effectiveExpiry = openExpiry;
        }
      }

      if (effectiveExpiry) {
        daysUntilExpiry = Math.ceil((effectiveExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (effectiveExpiry < now) {
          expiryStatus = 'EXPIRED';
        } else if (daysUntilExpiry <= thresholdDays) {
          expiryStatus = 'APPROACHING_EXPIRY';
        }
      }

      const isLowStock = item.quantity <= item.reorderThreshold;

      return {
        ...item,
        effectiveExpiry,
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

    let expiredCount = 0;
    let expiringSoonCount = 0;
    let lowStockCount = 0;
    const expiredItems: any[] = [];
    const expiringSoonItems: any[] = [];
    const lowStockItems: any[] = [];

    for (const item of allItems) {
      let effectiveExpiry: Date | null = item.expiryDate ? new Date(item.expiryDate) : null;
      const thresholdDays = item.alertThresholdDays || 30;

      if (item.openedAt && item.openVialDays) {
        const openExpiry = new Date(new Date(item.openedAt).getTime() + item.openVialDays * 24 * 60 * 60 * 1000);
        if (!effectiveExpiry || openExpiry < effectiveExpiry) {
          effectiveExpiry = openExpiry;
        }
      }

      if (effectiveExpiry) {
        const days = Math.ceil((effectiveExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (effectiveExpiry < now) {
          expiredCount++;
          expiredItems.push({ ...item, daysUntilExpiry: days });
        } else if (days <= thresholdDays) {
          expiringSoonCount++;
          expiringSoonItems.push({ ...item, daysUntilExpiry: days });
        }
      }

      if (item.quantity <= item.reorderThreshold) {
        lowStockCount++;
        lowStockItems.push(item);
      }
    }

    return reply.send({
      expiredCount,
      expiringSoonCount,
      lowStockCount,
      expiredItems,
      expiringSoonItems,
      lowStockItems,
    });
  });

  fastify.post('/inventory', async (request, reply) => {
    const {
      name,
      catalogCode,
      category,
      unit,
      quantity,
      reorderThreshold,
      expiryDate,
      receivedDate,
      openVialDays,
      alertThresholdDays,
      storageCondition,
      supplier,
      costPerUnit,
      lotNumber,
    } = request.body as any;

    if (!name || !unit || quantity === undefined || reorderThreshold === undefined || costPerUnit === undefined) {
      return reply.status(400).send({ message: 'جميع الحقول الأساسية للمخزون مطلوبة' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name: name.trim(),
        catalogCode: catalogCode?.trim() || null,
        category: category || 'REAGENT',
        unit,
        quantity: Number(quantity),
        reorderThreshold: Number(reorderThreshold),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        openVialDays: openVialDays ? Number(openVialDays) : null,
        alertThresholdDays: alertThresholdDays ? Number(alertThresholdDays) : 30,
        storageCondition: storageCondition || '2-8°C',
        supplier: supplier?.trim() || null,
        costPerUnit: Number(costPerUnit),
        lotNumber: lotNumber?.trim() || null,
      },
    });

    return reply.status(201).send(item);
  });

  // Mark item as opened (sets openedAt = now)
  fastify.post('/inventory/:id/open', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'المادة غير موجودة' });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        openedAt: new Date(),
      },
    });

    return reply.send(updated);
  });

  fastify.patch('/inventory/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const {
      name,
      catalogCode,
      category,
      unit,
      quantity,
      deltaQuantity,
      reorderThreshold,
      expiryDate,
      receivedDate,
      openVialDays,
      openedAt,
      alertThresholdDays,
      storageCondition,
      costPerUnit,
      supplier,
      lotNumber,
    } = request.body as any;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'عنصر المخزون غير موجود' });
    }

    let newQuantity = existing.quantity;
    if (quantity !== undefined) {
      newQuantity = Number(quantity);
    } else if (deltaQuantity !== undefined) {
      newQuantity = Math.max(0, existing.quantity + Number(deltaQuantity));
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(catalogCode !== undefined ? { catalogCode: catalogCode?.trim() || null } : {}),
        ...(category ? { category } : {}),
        ...(unit ? { unit } : {}),
        ...(supplier !== undefined ? { supplier: supplier?.trim() || null } : {}),
        ...(lotNumber !== undefined ? { lotNumber: lotNumber?.trim() || null } : {}),
        ...(storageCondition ? { storageCondition } : {}),
        quantity: newQuantity,
        reorderThreshold: reorderThreshold !== undefined ? Number(reorderThreshold) : existing.reorderThreshold,
        alertThresholdDays: alertThresholdDays !== undefined ? Number(alertThresholdDays) : existing.alertThresholdDays,
        openVialDays: openVialDays !== undefined ? (openVialDays ? Number(openVialDays) : null) : existing.openVialDays,
        openedAt: openedAt !== undefined ? (openedAt ? new Date(openedAt) : null) : existing.openedAt,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
        receivedDate: receivedDate !== undefined ? (receivedDate ? new Date(receivedDate) : null) : existing.receivedDate,
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
