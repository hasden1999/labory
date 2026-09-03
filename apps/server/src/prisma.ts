import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initDbWAL() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL;');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$executeRawUnsafe('PRAGMA cache_size = -64000;');
    console.log('⚡ SQLite WAL mode enabled successfully.');
  } catch (error) {
    console.error('Failed to enable WAL mode:', error);
  }
}
