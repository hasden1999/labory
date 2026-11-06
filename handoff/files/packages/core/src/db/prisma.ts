import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

let prismaInstance: PrismaClient | null = null;
let walConfigured = false;

export function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '').split('?')[0];
    if (path.isAbsolute(rawPath) && fs.existsSync(rawPath)) {
      return process.env.DATABASE_URL;
    }
  }

  const candidates = [
    process.env.LABRYO_DATA_DIR ? path.resolve(process.env.LABRYO_DATA_DIR) : null,
    'D:\\lab\\apps\\server\\prisma',
    path.resolve(process.cwd(), 'apps', 'server', 'prisma'),
    path.resolve(process.cwd(), '..', 'server', 'prisma'),
    path.resolve(process.cwd(), 'prisma'),
  ].filter(Boolean) as string[];

  let dbFile = '';
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

  if (!dbFile) {
    dbFile = 'D:/lab/apps/server/prisma/lab.db';
  }

  const normalized = dbFile.replace(/\\/g, '/');
  return `file:${normalized}?connection_limit=1&busy_timeout=5000`;
}

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: resolveDatabaseUrl(),
        },
      },
    });
  }
  return prismaInstance;
}

export const prisma = getPrismaClient();

export async function initDbWAL(): Promise<void> {
  if (walConfigured) return;
  const p = getPrismaClient();
  try {
    await p.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
    await p.$executeRawUnsafe('PRAGMA synchronous = NORMAL;');
    await p.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    await p.$executeRawUnsafe('PRAGMA busy_timeout = 5000;');
    await p.$executeRawUnsafe('PRAGMA cache_size = -64000;');
    await p.$executeRawUnsafe('PRAGMA temp_store = MEMORY;');
    walConfigured = true;
  } catch (error) {
    console.error('[Core DB] Failed to configure SQLite Pragmas:', error);
  }
}

export async function checkpointDbWAL(): Promise<void> {
  const p = getPrismaClient();
  try {
    await p.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (error) {
    console.error('[Core DB] Failed to checkpoint WAL journal:', error);
  }
}
