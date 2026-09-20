import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDbWAL, checkpointDbWAL, prisma } from './prisma';
import { startMDNS } from './utils/mdns';
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

const server = Fastify({ logger: true });

async function bootstrap() {
  // CORS & JWT
  await Promise.all([
    server.register(cors, { origin: true }),
    server.register(jwt, {
      secret: process.env.JWT_SECRET || 'LAB_MANAGER_SECRET_KEY_LOCAL_OFFLINE_2026',
    }),
  ]);

  // Single-Operator Auto Auth
  server.decorate('authenticate', async (request: any, reply: any) => {
    try {
      if (request.headers.authorization) {
        await request.jwtVerify();
      } else {
        request.user = { id: 'single_operator', name: 'المشغل', role: 'OWNER' };
      }
    } catch (err) {
      request.user = { id: 'single_operator', name: 'المشغل', role: 'OWNER' };
    }
  });

  server.decorate('requireOwner', async (request: any, reply: any) => {
    if (!request.user || request.user.role !== 'OWNER') {
      request.user = { id: 'single_operator', name: 'المشغل', role: 'OWNER' };
    }
  });

  // Root redirect to Web UI (Port 8080)
  server.get('/', async (request, reply) => {
    return reply.redirect('http://localhost:8080');
  });

  // Health check
  server.get('/health', async () => {
    return { status: 'OK', app: 'Lab Manager Single-User Edition' };
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
  server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
    console.log(`🚀 Lab Manager Backend running at: ${address}`);

    // Asynchronous non-blocking network services initialization
    Promise.all([
      startTcpDeviceServer().catch((err) => {
        console.error('Failed to start TCP Device Server:', err);
      }),
      Promise.resolve(startMDNS(PORT)),
    ]);
  });
}

bootstrap();
