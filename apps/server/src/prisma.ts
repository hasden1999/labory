import { PrismaClient } from '@prisma/client';
import path from 'path';

if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(__dirname, '../prisma/lab.db').replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${dbPath}?connection_limit=1`;
}

export const prisma = new PrismaClient();

async function ensureSessionTable(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "userName" TEXT,
        "role" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" DATETIME NOT NULL,
        "revokedAt" DATETIME
      );
    `);
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");'
    );
  } catch (err: any) {
    console.warn('[Prisma SQLite] Session table ensure notice:', err?.message);
  }
}

export async function initDbWAL() {
  const isBench = process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1';
  const t0 = isBench ? process.hrtime.bigint() : 0n;
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$queryRawUnsafe('PRAGMA cache_size = -64000;');
    await prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY;');
    await ensureSessionTable();
    if (isBench) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(`⏱️ [BENCHMARK] الاتصال بقاعدة البيانات/Prisma: ${ms.toFixed(2)}ms`);
    }
    console.log('⚡ SQLite WAL mode & optimized Pragmas initialized successfully.');
  } catch (error) {
    console.error('Failed to configure SQLite Pragmas:', error);
  }
}

export async function checkpointDbWAL() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    console.log('📦 SQLite WAL journal checkpointed and truncated.');
  } catch (error) {
    console.error('Failed to checkpoint WAL journal:', error);
  }
}

