import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initDbWAL() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$queryRawUnsafe('PRAGMA cache_size = -64000;');
    console.log('⚡ SQLite WAL mode enabled successfully.');
  } catch (error) {
    console.error('Failed to enable WAL mode:', error);
  }
}
