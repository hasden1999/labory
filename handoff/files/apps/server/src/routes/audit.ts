import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export async function auditRoutes(fastify: FastifyInstance) {
  // List Audit Logs with filtering and pagination
  fastify.get('/audit-logs', async (request, reply) => {
    const { action, entity, query, limit = '50', offset = '0' } = request.query as {
      action?: string;
      entity?: string;
      query?: string;
      limit?: string;
      offset?: string;
    };

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = Math.max(parseInt(offset, 10) || 0, 0);

    const where: any = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (entity && entity !== 'ALL') {
      where.entity = entity;
    }
    if (query && query.trim()) {
      where.OR = [
        { details: { contains: query.trim() } },
        { entityId: { contains: query.trim() } },
        { userName: { contains: query.trim() } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      logs,
      total,
      limit: take,
      offset: skip,
    });
  });

  // Get single entity audit history
  fastify.get('/audit-logs/:entity/:entityId', async (request, reply) => {
    const { entity, entityId } = request.params as { entity: string; entityId: string };

    const logs = await prisma.auditLog.findMany({
      where: {
        entity: entity.toUpperCase(),
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send(logs);
  });
}
