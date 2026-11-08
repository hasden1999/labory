import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '').split('?')[0];
    if (path.isAbsolute(rawPath) && fs.existsSync(rawPath)) {
      return process.env.DATABASE_URL;
    }
  }

  const candidates = [
    process.env.LABRYO_DATA_DIR ? path.resolve(process.env.LABRYO_DATA_DIR) : null,
    path.resolve(process.cwd(), '..', 'server', 'prisma'),
    path.resolve(process.cwd(), 'apps', 'server', 'prisma'),
    path.resolve(process.cwd(), 'prisma'),
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), 'apps', 'web', 'data'),
    path.resolve(process.cwd(), 'prisma'),
  ].filter(Boolean) as string[];

  let dbFile = '';
  // First pass: find candidate that has content (> 10KB)
  for (const dir of candidates) {
    const candidate = path.join(dir, 'lab.db');
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        if (stat.size > 10000) {
          dbFile = candidate;
          break;
        }
      } catch {}
    }
  }
  // Second pass: fallback to any existing
  if (!dbFile) {
    for (const dir of candidates) {
      const candidate = path.join(dir, 'lab.db');
      if (fs.existsSync(candidate)) {
        dbFile = candidate;
        break;
      }
    }
  }

  if (!dbFile) {
    const defaultDir = process.env.VERCEL
      ? '/tmp'
      : (process.env.LABRYO_DATA_DIR
          ? path.resolve(process.env.LABRYO_DATA_DIR)
          : path.resolve(process.cwd(), 'apps', 'server', 'prisma'));
    if (!fs.existsSync(defaultDir)) {
      try { fs.mkdirSync(defaultDir, { recursive: true }); } catch {}
    }
    dbFile = path.join(defaultDir, 'lab.db');
  }

  const normalized = dbFile.replace(/\\/g, '/');
  return `file:${normalized}?connection_limit=1&socket_timeout=10000&busy_timeout=5000`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; walInitialized?: boolean };

function initPrismaClient(): PrismaClient | null {
  if (process.arch === 'ia32') {
    return null;
  }
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  try {
    const instance = new PrismaClient({
      datasources: {
        db: {
          url: resolveDatabaseUrl(),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    globalForPrisma.prisma = instance;
    return instance;
  } catch (err: any) {
    console.warn('⚠️ [Prisma SQLite] PrismaClient could not be initialized (falling back to memory/JSON store):', err?.message || err);
    return null;
  }
}

const rawPrisma = initPrismaClient();

// Safe fallback Proxy: If Prisma is missing or uninitialized on the cloud, prevents crashes and rejects gracefully
export const prisma: PrismaClient = rawPrisma || (new Proxy({}, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    return new Proxy({}, {
      get(_target2, method) {
        if (method === 'then') return undefined;
        return async () => {
          if (process.arch === 'ia32') {
            if (method === 'count') return 0;
            if (method === 'findMany' || method === 'deleteMany') return [];
            return null;
          }
          throw new Error(`Prisma is not available in this environment. Method: ${String(prop)}.${String(method)}`);
        };
      }
    });
  }
}) as unknown as PrismaClient);

async function ensureSessionTable(client: PrismaClient): Promise<void> {
  try {
    await client.$executeRawUnsafe(`
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
    await client.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");'
    );
    await client.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");'
    );
  } catch (err: any) {
    console.warn('[Prisma SQLite] Session table ensure notice:', err?.message);
  }
}

export async function initDbWAL() {
  if (!rawPrisma || globalForPrisma.walInitialized) return;
  const isBench = process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1';
  const t0Pragmas = isBench ? process.hrtime.bigint() : BigInt(0);
  const pragmas = [
    'PRAGMA journal_mode = WAL;',
    'PRAGMA synchronous = NORMAL;',
    'PRAGMA foreign_keys = ON;',
    'PRAGMA busy_timeout = 5000;',
    'PRAGMA cache_size = -64000;',
    'PRAGMA temp_store = MEMORY;',
  ];
  for (const p of pragmas) {
    try {
      await rawPrisma.$queryRawUnsafe(p);
    } catch (e) {
      // Ignored if non-fatal
    }
  }
  globalForPrisma.walInitialized = true;
  if (isBench) {
    const ms = Number(process.hrtime.bigint() - t0Pragmas) / 1e6;
    console.log(`⏱️ [BENCHMARK] الاتصال بقاعدة البيانات/Prisma: ${ms.toFixed(2)}ms`);
  }
  console.log('⚡ [Prisma SQLite] WAL mode & high-performance Pragmas initialized successfully.');

  // Session registry must exist regardless of the stored user_version.
  await ensureSessionTable(rawPrisma);

  // Safe additive self-healing schema migration for existing SQLite databases (runs ONLY when app/schema version changes)
  const CURRENT_SCHEMA_VERSION = 145;
  const t0Mig = isBench ? process.hrtime.bigint() : BigInt(0);
  try {
    const vRes: any = await rawPrisma.$queryRawUnsafe('PRAGMA user_version;');
    const currentV = Array.isArray(vRes) && vRes[0] ? Number(vRes[0].user_version) : 0;
    if (currentV >= CURRENT_SCHEMA_VERSION) {
      if (isBench) {
        const ms = Number(process.hrtime.bigint() - t0Mig) / 1e6;
        console.log(`⏱️ [BENCHMARK] migrations (مكتملة مسبقاً، تخطي فوري): ${ms.toFixed(2)}ms`);
      }
      return;
    }

    const catalogCols: any = await rawPrisma.$queryRawUnsafe('PRAGMA table_info(TestCatalog);');
    const colNames = Array.isArray(catalogCols) ? catalogCols.map((c: any) => c.name) : [];
    if (!colNames.includes('specialtyId')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "TestCatalog" ADD COLUMN "specialtyId" TEXT;');
    }
    if (!colNames.includes('groupId')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "TestCatalog" ADD COLUMN "groupId" TEXT;');
    }
    if (!colNames.includes('sortOrder')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "TestCatalog" ADD COLUMN "sortOrder" INTEGER;');
    }
    if (!colNames.includes('tubeType')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "TestCatalog" ADD COLUMN "tubeType" TEXT;');
    }

    const settingsCols: any = await rawPrisma.$queryRawUnsafe('PRAGMA table_info(Settings);');
    const setColNames = Array.isArray(settingsCols) ? settingsCols.map((c: any) => c.name) : [];
    if (!setColNames.includes('groupingStyle')) {
      await rawPrisma.$queryRawUnsafe("ALTER TABLE \"Settings\" ADD COLUMN \"groupingStyle\" TEXT DEFAULT 'category';");
    }
    if (!setColNames.includes('logoWidthMm')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "logoWidthMm" REAL;');
    }
    if (!setColNames.includes('logoAlign')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "logoAlign" TEXT;');
    }
    if (!setColNames.includes('logoOffsetXMm')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "logoOffsetXMm" REAL;');
    }
    if (!setColNames.includes('logoOffsetYMm')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "logoOffsetYMm" REAL;');
    }
    if (!setColNames.includes('logoUrl')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "logoUrl" TEXT;');
    }
    if (!setColNames.includes('enableWatermark')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "enableWatermark" BOOLEAN DEFAULT 0;');
    }
    if (!setColNames.includes('printRangeScope')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Settings" ADD COLUMN "printRangeScope" TEXT DEFAULT \'all\';');
    }

    const refDoctorCols: any = await rawPrisma.$queryRawUnsafe('PRAGMA table_info(ReferringDoctor);');
    const refDoctorColNames = Array.isArray(refDoctorCols) ? refDoctorCols.map((c: any) => c.name) : [];
    if (!refDoctorColNames.includes('isActive')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "ReferringDoctor" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT 1;');
    }

    const patientCols: any = await rawPrisma.$queryRawUnsafe('PRAGMA table_info(Patient);');
    const patientColNames = Array.isArray(patientCols) ? patientCols.map((c: any) => c.name) : [];
    if (!patientColNames.includes('birthDate')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Patient" ADD COLUMN "birthDate" DATETIME;');
    }
    if (!patientColNames.includes('birthDateEstimated')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Patient" ADD COLUMN "birthDateEstimated" BOOLEAN DEFAULT 0;');
    }
    if (!patientColNames.includes('referringDoctorId')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "Patient" ADD COLUMN "referringDoctorId" TEXT;');
    }

    const sampleTestCols: any = await rawPrisma.$queryRawUnsafe('PRAGMA table_info(SampleTest);');
    const sampleTestColNames = Array.isArray(sampleTestCols) ? sampleTestCols.map((c: any) => c.name) : [];
    if (!sampleTestColNames.includes('crystals')) {
      await rawPrisma.$queryRawUnsafe('ALTER TABLE "SampleTest" ADD COLUMN "crystals" TEXT;');
    }

    await rawPrisma.$queryRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Specialty" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "nameEn" TEXT NOT NULL,
        "nameAr" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await rawPrisma.$queryRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TestGroup" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "specialtyId" TEXT NOT NULL,
        "nameEn" TEXT NOT NULL,
        "nameAr" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await rawPrisma.$queryRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferenceRange" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "testId" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "sex" TEXT NOT NULL DEFAULT 'any',
        "ageMin" REAL,
        "ageMax" REAL,
        "ageUnit" TEXT NOT NULL DEFAULT 'years',
        "low" REAL,
        "high" REAL,
        "text" TEXT,
        "unit" TEXT,
        "note" TEXT,
        "source" TEXT,
        "sourceUrl" TEXT,
        "isUserEdited" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await rawPrisma.$queryRawUnsafe(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
  } catch (migErr: any) {
    console.warn('[Prisma SQLite] Safe auto-migration notice:', migErr?.message);
  } finally {
    if (isBench) {
      const ms = Number(process.hrtime.bigint() - t0Mig) / 1e6;
      console.log(`⏱️ [BENCHMARK] migrations: ${ms.toFixed(2)}ms`);
    }
  }
}

export async function checkpointDbWAL() {
  if (!rawPrisma) return;
  try {
    await rawPrisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    console.log('📦 [Prisma SQLite] WAL journal checkpointed and truncated.');
  } catch (error) {
    console.error('[Prisma SQLite] Failed to checkpoint WAL journal:', error);
  }
}
