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
    'D:\\lab\\apps\\server\\prisma',
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
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = instance;
    }
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
          throw new Error(`Prisma is not available in this environment. Method: ${String(prop)}.${String(method)}`);
        };
      }
    });
  }
}) as unknown as PrismaClient);

export async function initDbWAL() {
  if (!rawPrisma || globalForPrisma.walInitialized) return;
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
  console.log('⚡ [Prisma SQLite] WAL mode & high-performance Pragmas initialized successfully.');
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
