import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export function initBackupCron() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Schedule daily backup at midnight (00:00)
  cron.schedule('0 0 * * *', () => {
    runBackupSnapshot();
  });
}

export function runBackupSnapshot(): string {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const dbPath = path.join(process.cwd(), 'prisma', 'lab.db');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `lab_backup_${timestamp}.db`;
  const destPath = path.join(BACKUP_DIR, backupFileName);

  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, destPath);
    console.log(`Database backup snapshot created: ${backupFileName}`);
    return backupFileName;
  }
  return '';
}

export async function backupRoutes(fastify: FastifyInstance) {
  fastify.post('/backup/run', { onRequest: [fastify.authenticate, fastify.requireOwner] }, async (request, reply) => {
    const fileName = runBackupSnapshot();
    if (!fileName) {
      return reply.status(500).send({ message: 'فشل إنشاء النسخة الاحتياطية' });
    }
    return reply.send({
      message: 'تم إنشاء النسخة الاحتياطية بنجاح!',
      fileName,
    });
  });

  fastify.get('/backup/list', { onRequest: [fastify.authenticate, fastify.requireOwner] }, async (request, reply) => {
    if (!fs.existsSync(BACKUP_DIR)) {
      return reply.send([]);
    }

    const files = fs.readdirSync(BACKUP_DIR).map((f) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        fileName: f,
        sizeBytes: stats.size,
        createdAt: stats.birthtime,
      };
    });

    return reply.send(files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  });
}
