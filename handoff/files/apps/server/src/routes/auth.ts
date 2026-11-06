import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { writeAudit } from '../utils/audit';

const SESSION_TTL_HOURS = 12;
const SESSION_PRUNE_AFTER_DAYS = 7;

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    if (!username || !password) {
      return reply.status(400).send({ message: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }

    const staff = await prisma.staff.findUnique({ where: { username } });
    if (!staff || !staff.active) {
      return reply.status(401).send({ message: 'اسم المستخدم غير موجود أو الحساب غير مفعل' });
    }

    const isMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ message: 'كلمة المرور غير صحيحة' });
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    try {
      await prisma.session.create({
        data: {
          id: sessionId,
          userId: staff.id,
          userName: staff.name,
          role: staff.role,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || null,
          expiresAt,
        },
      });
    } catch (err: any) {
      request.log.error({ err }, 'Failed to create server-side session');
      return reply.status(503).send({
        message: 'تعذر إنشاء جلسة دخول آمنة. يرجى المحاولة مرة أخرى.',
      });
    }

    const token = fastify.jwt.sign(
      {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        sid: sessionId,
      },
      { expiresIn: `${SESSION_TTL_HOURS}h` }
    );

    void prisma.session
      .deleteMany({
        where: {
          expiresAt: {
            lt: new Date(Date.now() - SESSION_PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000),
          },
        },
      })
      .catch(() => {});

    await writeAudit({
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: staff.id,
      details: `تسجيل دخول ناجح للمستخدم ${staff.username}`,
      userId: staff.id,
      userName: staff.name,
      ipAddress: request.ip,
    });

    return reply.send({
      token,
      user: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
      },
    });
  });

  // Logout (idempotent: revokes the session when a valid token is supplied)
  fastify.post('/auth/logout', async (request, reply) => {
    if (request.headers.authorization) {
      try {
        const payload = (await request.jwtVerify()) as any;
        if (payload?.sid) {
          await prisma.session.updateMany({
            where: { id: payload.sid, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          await writeAudit({
            action: 'LOGOUT',
            entity: 'AUTH',
            entityId: payload.id || payload.sid,
            details: 'تسجيل خروج وإبطال الجلسة الحالية',
            userId: payload.id,
            userName: payload.name,
            ipAddress: request.ip,
          });
        }
      } catch {
        // Invalid/expired token: logout remains a successful no-op.
      }
    }
    return reply.send({ message: 'تم تسجيل الخروج بنجاح' });
  });

  // Revoke every active session for the current user
  fastify.post(
    '/auth/logout-all',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const result = await prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await writeAudit({
        action: 'LOGOUT_ALL',
        entity: 'AUTH',
        entityId: user.id,
        details: `إبطال جميع الجلسات النشطة (${result.count})`,
        userId: user.id,
        userName: user.name,
        ipAddress: request.ip,
      });
      return reply.send({
        message: 'تم إبطال جميع الجلسات النشطة',
        revoked: result.count,
      });
    }
  );

  // Get current user profile
  fastify.get('/auth/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string };
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, username: true, role: true, phone: true, active: true },
    });
    if (!staff) {
      return reply.status(404).send({ message: 'الموظف غير موجود' });
    }
    return reply.send(staff);
  });

  // Staff management (OWNER only)
  fastify.get('/staff', { onRequest: [fastify.authenticate, fastify.requireOwner] }, async (request, reply) => {
    const staffList = await prisma.staff.findMany({
      select: { id: true, name: true, username: true, role: true, phone: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(staffList);
  });

  fastify.post('/staff', { onRequest: [fastify.authenticate, fastify.requireOwner] }, async (request, reply) => {
    const { name, username, password, role, phone } = request.body as any;

    if (!name || !username || !password || !role) {
      return reply.status(400).send({ message: 'جميع الحقول الأساسية مطلوبة' });
    }

    const existing = await prisma.staff.findUnique({ where: { username } });
    if (existing) {
      return reply.status(400).send({ message: 'اسم المستخدم مستعمل بالفعل' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newStaff = await prisma.staff.create({
      data: {
        name,
        username,
        passwordHash,
        role,
        phone,
      },
      select: { id: true, name: true, username: true, role: true, phone: true, active: true },
    });

    return reply.status(210).send(newStaff);
  });

  fastify.patch('/staff/:id', { onRequest: [fastify.authenticate, fastify.requireOwner] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, role, phone, active, password } = request.body as any;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (role !== undefined) dataToUpdate.role = role;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (active !== undefined) dataToUpdate.active = active;
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, username: true, role: true, phone: true, active: true },
    });

    // A deactivated account or a password change must invalidate every existing session.
    if (active === false || password) {
      await prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await writeAudit({
      action: 'UPDATE',
      entity: 'STAFF',
      entityId: id,
      details: `تحديث حساب موظف${active === false ? ' وتعطيله' : ''}${password ? ' وتغيير كلمة مروره' : ''}`,
      userId: (request.user as any)?.id,
      userName: (request.user as any)?.name,
      ipAddress: request.ip,
    });

    return reply.send(updated);
  });
}
