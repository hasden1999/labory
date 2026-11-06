#!/usr/bin/env node
// ==============================================================================
// سكربت التراجع السريع في حالات الطوارئ السريرية (Clinical Emergency Rollback)
// ==============================================================================
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const backupsRoot = path.join(rootDir, 'backups');
const logFile = path.join(backupsRoot, 'rollback.log');

function log(msg) {
  const formatted = `[${new Date().toISOString()}] [LIS-ROLLBACK] ${msg}`;
  console.log(formatted);
  try {
    fs.appendFileSync(logFile, formatted + '\n', 'utf8');
  } catch {}
}

log('🚨 تنبيه طوارئ: بدء إجراءات التراجع الفوري لنظام المختبرات السريرية 🚨');

// 1. استعادة كود الإصدار السابق من Git
const prevCommitFile = path.join(backupsRoot, 'PREVIOUS_COMMIT');
if (fs.existsSync(prevCommitFile)) {
  const prevCommit = fs.readFileSync(prevCommitFile, 'utf8').trim();
  log(`العودة إلى الـ Git Commit السابق المستقر: ${prevCommit}`);
  try {
    execSync(`git checkout ${prevCommit}`, { cwd: rootDir, stdio: 'inherit' });
  } catch (e) {
    log('تحذير: تعذر الانتقال عبر Git checkout، جاري الاستمرار...');
  }
} else {
  log('تنبيه: ملف PREVIOUS_COMMIT غير موجود. التراجع خطوة واحدة للخلف عبر Git...');
  try {
    execSync('git checkout HEAD~1', { cwd: rootDir, stdio: 'inherit' });
  } catch {}
}

// 2. استعادة ملفات البيئة وقاعدة البيانات من أحدث نسخة صالحة
const latestPointer = path.join(backupsRoot, 'LATEST_VALID_BACKUP');
if (fs.existsSync(latestPointer)) {
  const latestBackupDir = fs.readFileSync(latestPointer, 'utf8').trim();
  if (fs.existsSync(latestBackupDir)) {
    const bakEnv = path.join(latestBackupDir, '.env.bak');
    if (fs.existsSync(bakEnv)) {
      log('استرجاع ملف الإعدادات .env...');
      fs.copyFileSync(bakEnv, path.join(rootDir, '.env'));
    }

    if (process.argv.includes('--restore-db')) {
      log('⚠️ استعادة قاعدة البيانات السريرية كاملة من النسخة الاحتياطية...');
      const files = fs.readdirSync(latestBackupDir);
      const dbBak = files.find(f => f.endsWith('.db'));
      if (dbBak) {
        const sourceDb = path.join(latestBackupDir, dbBak);
        const targetDb = path.join(rootDir, 'apps', 'server', 'prisma', 'lab.db');
        fs.copyFileSync(sourceDb, targetDb);
        log(`تمت استعادة قاعدة بيانات الفحوصات الطبية بنجاح من: ${dbBak}`);
      }
    }
  }
}

// 3. إعادة توليد عميل Prisma
log('إعادة توليد Prisma Client...');
try {
  execSync('npx prisma generate --schema=apps/server/prisma/schema.prisma', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  log('تحذير أثناء توليد Prisma Client: ' + e.message);
}

log('✅ اكتملت إجراءات التراجع بنجاح. يرجى التحقق من عمل محطات المختبر.');
