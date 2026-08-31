import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initDbWAL() {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    console.log('⚡ SQLite WAL mode enabled successfully.');
  } catch (error) {
    console.error('Failed to enable WAL mode:', error);
  }
}
