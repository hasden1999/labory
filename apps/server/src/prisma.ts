import { PrismaClient } from '@prisma/client';
import path from 'path';

if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(__dirname, '../prisma/lab.db').replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${dbPath}?connection_limit=1`;
}

export const prisma = new PrismaClient();

export async function initDbWAL() {
  try {
    await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL;');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$executeRawUnsafe('PRAGMA cache_size = -64000;');
    await prisma.$executeRawUnsafe('PRAGMA temp_store = MEMORY;');
    console.log('⚡ SQLite WAL mode & optimized Pragmas initialized successfully.');
  } catch (error) {
    console.error('Failed to configure SQLite Pragmas:', error);
  }
}

export async function checkpointDbWAL() {
  try {
    await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    console.log('📦 SQLite WAL journal checkpointed and truncated.');
  } catch (error) {
    console.error('Failed to checkpoint WAL journal:', error);
  }
}

