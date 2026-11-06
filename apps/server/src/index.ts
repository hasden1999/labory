import './env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDbWAL, checkpointDbWAL, prisma } from './prisma';
import { startMDNS } from './utils/mdns';
import { preWarmPuppeteer } from './utils/pdf';
import { whatsappService } from './services/whatsappService';
import { authRoutes } from './routes/auth';
import { patientRoutes } from './routes/patients';
import { sampleRoutes } from './routes/samples';
import { testCatalogRoutes } from './routes/tests';
import { resultRoutes } from './routes/results';
import { inventoryRoutes } from './routes/inventory';
import { reportRoutes } from './routes/reports';
import { expenseRoutes } from './routes/expenses';
import { doctorRoutes } from './routes/doctors';
import { networkRoutes } from './routes/network';
import { whatsappRoutes } from './routes/whatsapp';
import { licenseRoutes } from './routes/license';
import { backupRoutes, initBackupCron } from './routes/backup';
import { settingsRoutes } from './routes/settings';
import { debtRoutes } from './routes/debts';
import { financialRoutes } from './routes/financials';
import { archiveRoutes } from './routes/archive';
import { deviceRoutes } from './routes/devices';
import { auditRoutes } from './routes/audit';
import { startTcpDeviceServer, stopTcpDeviceServer } from './services/tcpDeviceServer';
import crypto from 'crypto';

const tServerEntry = (process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1') ? process.hrtime.bigint() : 0n;
const server = Fastify({ logger: true });

async function bootstrap() {
  const isBench = process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1';
  if (isBench) {
    const ms = Number(process.hrtime.bigint() - tServerEntry) / 1e6;
    console.log(`⏱️ [BENCHMARK] تشغيل الخدمة: ${ms.toFixed(2)}ms`);
  }
  // CORS & JWT (fail-closed)
  const defaultOrigins = [
    'http://127.0.0.1:8080',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ];
  const allowedOrigins = (process.env.LABRYO_CORS_ORIGINS || defaultOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!process.env.JWT_SECRET) {
    server.log.warn('[SECURITY] JWT_SECRET is not set; using an ephemeral secret. Sessions will not survive a restart.');
  }

  await Promise.all([
    server.register(cors, {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('CORS origin is not allowed'), false);
      },
      credentials: true,
    }),
    server.register(jwt, {
      secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    }),
  ]);

  // Authentication & authorization (fail-closed, session-backed)
  server.decorate('authenticate', async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.status(401).send({ message: 'Authentication required' });
    }
    let payload: any;
    try {
      payload = await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ message: 'Invalid or expired token' });
    }

    const sessionId = payload?.sid;
    if (!sessionId || typeof sessionId !== 'string') {
      return reply.status(401).send({ message: 'Session identifier missing' });
    }

    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      const now = new Date();
      if (!session || session.revokedAt || session.expiresAt <= now) {
        return reply.status(401).send({ message: 'Session expired or revoked' });
      }

      request.user = {
        id: payload.id,
        name: payload.name,
        username: payload.username,
        role: payload.role,
        sessionId,
      };

      // Refresh lastSeenAt at most once every five minutes to avoid write amplification.
      if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
        void prisma.session
          .update({ where: { id: sessionId }, data: { lastSeenAt: now } })
          .catch(() => {});
      }
    } catch (err) {
      request.log.error({ err }, 'Session verification failed');
      return reply.status(503).send({ message: 'Session verification unavailable' });
    }
  });

  server.decorate('requireOwner', async (request: any, reply: any) => {
    const role = request.user?.role;
    if (!request.user || (role !== 'OWNER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return reply.status(403).send({ message: 'Owner privileges required' });
    }
  });

  // Root redirect to Web UI (Port 8080)
  server.get('/', async (request, reply) => {
    return reply.redirect('http://127.0.0.1:8080');
  });

  // Health & Readiness checks
  server.get('/health', async () => {
    return { status: 'OK', app: 'Lab Manager Single-User Edition' };
  });

  server.get('/ready', async () => {
    return { ready: true, status: 'READY', timestamp: Date.now() };
  });

  // Register All Routes in Parallel
  await Promise.all([
    server.register(authRoutes),
    server.register(patientRoutes),
    server.register(sampleRoutes),
    server.register(testCatalogRoutes),
    server.register(resultRoutes),
    server.register(inventoryRoutes),
    server.register(reportRoutes),
    server.register(expenseRoutes),
    server.register(doctorRoutes),
    server.register(networkRoutes),
    server.register(whatsappRoutes),
    server.register(licenseRoutes),
    server.register(backupRoutes),
    server.register(settingsRoutes),
    server.register(debtRoutes),
    server.register(financialRoutes),
    server.register(archiveRoutes),
    server.register(deviceRoutes),
    server.register(auditRoutes),
  ]);

  // Initialize DB WAL mode
  await initDbWAL();

  // Startup Test Catalog Invariance & Duplicate Guard
  (async () => {
    try {
      const activeTests = await prisma.testCatalog.findMany({
        where: { active: true },
        select: { id: true, name: true, code: true }
      });
      const seenNames = new Set<string>();
      let duplicateCount = 0;
      for (const t of activeTests) {
        const norm = t.name.trim().toLowerCase();
        if (seenNames.has(norm)) {
          duplicateCount++;
        } else {
          seenNames.add(norm);
        }
      }
      if (duplicateCount > 0) {
        console.warn(`⚠️ [Catalog Startup Guard] Warning: ${duplicateCount} duplicate tests detected in catalog.`);
      } else {
        console.log(`💎 [Catalog Startup Guard] Test catalog healthy (${activeTests.length} active tests, 0 duplicates).`);
      }
    } catch (e) {}
  })();

  // Initialize Cron Jobs
  initBackupCron();

  // Graceful Shutdown Handler
  let isShuttingDown = false;
  async function gracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 [Shutdown] Signal received (${signal}). Closing services gracefully...`);

    try {
      await stopTcpDeviceServer().catch((e) => console.error('Error stopping TCP server:', e));
      await server.close();
      await checkpointDbWAL();
      await prisma.$disconnect();
      console.log('✅ [Shutdown] Server and database closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('❌ [Shutdown] Error during shutdown:', err);
      process.exit(1);
    }
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Listen on PORT 8000
  const PORT = Number(process.env.PORT) || 8000;
  server.listen({ port: PORT, host: '127.0.0.1' }, (err, address) => {
    if (err) {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
    if (isBench) {
      const ms = Number(process.hrtime.bigint() - tServerEntry) / 1e6;
      console.log(`⏱️ [BENCHMARK] جاهزية Fastify: ${ms.toFixed(2)}ms`);
    }
    console.log(`🚀 Lab Manager Backend running at: ${address}`);

    // Asynchronous non-blocking network services initialization
    Promise.all([
      startTcpDeviceServer().catch((err) => {
        console.error('Failed to start TCP Device Server:', err);
      }),
    ]);

    // Defer heavy background tasks (mDNS, Baileys, Puppeteer) after startup
    setTimeout(() => {
      startMDNS(PORT);
      whatsappService.checkExistingSession();
      preWarmPuppeteer(1000);
    }, 2500);
  });
}

bootstrap();
