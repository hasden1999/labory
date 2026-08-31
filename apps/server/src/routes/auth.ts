import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

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

    const token = fastify.jwt.sign({
      id: staff.id,
      name: staff.name,
      username: staff.username,
      role: staff.role,
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

  // Logout
  fastify.post('/auth/logout', async (request, reply) => {
    return reply.send({ message: 'تم تسجيل الخروج بنجاح' });
  });

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

    return reply.send(updated);
  });
}
