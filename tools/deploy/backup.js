#!/usr/bin/env node
// ==============================================================================
// بروتوكول النسخ الاحتياطي السريري المسبق لنظام المختبرات (Lab Backup Safeguard)
// ==============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '../..');
const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const timestamp = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const backupDir = path.join(rootDir, 'backups', timestamp);
const logFile = path.join(rootDir, 'backups', 'backup.log');

function log(msg) {
  const formatted = `[${new Date().toISOString()}] [LIS-BACKUP] ${msg}`;
  console.log(formatted);
  try {
    fs.appendFileSync(logFile, formatted + '\n', 'utf8');
  } catch {}
}

function err(msg) {
  const formatted = `[${new Date().toISOString()}] [LIS-CRITICAL-ERROR] ${msg}`;
  console.error(formatted);
  try {
    fs.appendFileSync(logFile, formatted + '\n', 'utf8');
  } catch {}
  process.exit(1);
}

log('=== بدء بروتوكول النسخ الاحتياطي الوقائي لنظام المختبرات الطبية ===');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 1. أخذ نسخة من ملف الإعدادات .env
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  log('1/3 أخذ لقطة لملف الإعدادات .env...');
  const envContent = fs.readFileSync(envFile);
  const targetEnv = path.join(backupDir, '.env.bak');
  fs.writeFileSync(targetEnv, envContent);
  const envHash = crypto.createHash('sha256').update(envContent).digest('hex');
  fs.writeFileSync(path.join(backupDir, '.env.sha256'), envHash, 'utf8');
  log(`تم توثيق بصمة ملف الإعدادات: ${envHash}`);
}

// 2. فحص ونسخ قاعدة بيانات الفحوصات الطبية lab.db
const dbFile = path.join(rootDir, 'apps', 'server', 'prisma', 'lab.db');
if (fs.existsSync(dbFile)) {
  log('2/3 جاري نسخ قاعدة بيانات الفحوصات والمرضى السريرية (lab.db)...');
  const targetDb = path.join(backupDir, `lab_clinical_${timestamp}.db`);
  
  // نسخ الملف
  fs.copyFileSync(dbFile, targetDb);
  
  const stats = fs.statSync(targetDb);
  if (stats.size < 1024) {
    err(`حجم ملف قاعدة البيانات صغير جداً (${stats.size} bytes)! تم إيقاف النشر لحماية البيانات.`);
  }

  // التحقق من رأس ملف SQLite
  const fd = fs.openSync(targetDb, 'r');
  const buf = Buffer.alloc(16);
  fs.readSync(fd, buf, 0, 16, 0);
  fs.closeSync(fd);
  const header = buf.toString('utf8');
  if (!header.startsWith('SQLite format 3')) {
    err(`رأس ملف قاعدة البيانات تالف أو غير صالح: ${header}`);
  }

  // حساب البصمة
  const dbBuffer = fs.readFileSync(targetDb);
  const dbHash = crypto.createHash('sha256').update(dbBuffer).digest('hex');
  fs.writeFileSync(`${targetDb}.sha256`, dbHash, 'utf8');
  
  log(`✅ تم تأكيد سلامة قاعدة البيانات السريرية بنجاح. الحجم: ${(stats.size / 1024 / 1024).toFixed(2)} MB والبصمة: ${dbHash}`);
} else {
  log('تنبيه: لم يتم العثور على ملف lab.db محلي.');
}

// 3. توثيق أحدث مسار صالح للطوارئ
const latestPointer = path.join(rootDir, 'backups', 'LATEST_VALID_BACKUP');
fs.writeFileSync(latestPointer, backupDir, 'utf8');
log(`تم تسجيل المسار المرجعي للطوارئ: ${backupDir}`);

// 4. تدوير النسخ القديمة الأكبر من 30 يوماً
const backupsRoot = path.join(rootDir, 'backups');
const entries = fs.readdirSync(backupsRoot, { withFileTypes: true });
const now = Date.now();
const thirtyDays = 30 * 24 * 60 * 60 * 1000;

entries.forEach(entry => {
  if (entry.isDirectory() && (/^\d{8}_\d{6}$/.test(entry.name) || /^\d{14}/.test(entry.name))) {
    const dirPath = path.join(backupsRoot, entry.name);
    const dirStat = fs.statSync(dirPath);
    if (now - dirStat.mtimeMs > thirtyDays) {
      log(`حذف نسخة قديمة (>30 يوماً): ${entry.name}`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
});

log('=== اكتمل النسخ الاحتياطي السريري بنجاح تام ===');
