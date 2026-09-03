import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDbWAL } from './prisma';
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

const server = Fastify({ logger: true });

async function bootstrap() {
  // CORS
  await server.register(cors, { origin: true });

  // JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'LAB_MANAGER_SECRET_KEY_LOCAL_OFFLINE_2026',
  });

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
    // TODO: In production multi-user mode, return 401 instead of defaulting to OWNER
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

  // Register Routes
  await server.register(authRoutes);
  await server.register(patientRoutes);
  await server.register(sampleRoutes);
  await server.register(testCatalogRoutes);
  await server.register(resultRoutes);
  await server.register(inventoryRoutes);
  await server.register(reportRoutes);
  await server.register(expenseRoutes);
  await server.register(doctorRoutes);
  await server.register(networkRoutes);
  await server.register(whatsappRoutes);
  await server.register(licenseRoutes);
  await server.register(backupRoutes);
  await server.register(settingsRoutes);
  await server.register(debtRoutes);
  await server.register(financialRoutes);
  await server.register(archiveRoutes);
  await server.register(deviceRoutes);

  // Initialize DB WAL mode
  await initDbWAL();

  // Initialize Cron Jobs
  initBackupCron();

  // Listen on PORT 8000
  const PORT = Number(process.env.PORT) || 8000;
  server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
    console.log(`🚀 Lab Manager Backend running at: ${address}`);
    startMDNS(PORT);
  });
}

bootstrap();
