#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function logStep(step, message) {
  console.log(`\n======================================================`);
  console.log(`  [${step}] ${message}`);
  console.log(`======================================================`);
}

async function run() {
  const rootDir = path.resolve(__dirname, '..');
  const webDir = path.join(rootDir, 'apps', 'web');
  const desktopDir = path.join(rootDir, 'apps', 'desktop');
  const engineDir = path.join(desktopDir, 'engine');

  logStep('1/5', 'التحقق من وجود محرك Node.js المحمول...');
  const nodeCandidates = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
    process.execPath,
  ];

  let foundNode = null;
  for (const nc of nodeCandidates) {
    if (fs.existsSync(nc) && nc.endsWith('node.exe')) {
      foundNode = nc;
      break;
    }
  }

  if (!foundNode) {
    try {
      const whichNode = execSync('where node.exe', { encoding: 'utf-8' }).trim().split('\n')[0].trim();
      if (fs.existsSync(whichNode)) foundNode = whichNode;
    } catch {}
  }

  if (!foundNode) {
    throw new Error('لم يتم العثور على node.exe على هذا الجهاز! يرجى التأكد من تثبيت Node.js.');
  }

  console.log(`تم العثور على Node.js في: ${foundNode}`);

  logStep('2/5', 'بناء وتحديث نسخة الخادم المستقلة (Next.js Standalone)...');
  const standaloneWebDir = path.join(webDir, '.next', 'standalone');
  if (!fs.existsSync(standaloneWebDir) || process.argv.includes('--rebuild')) {
    console.log('جاري تشغيل بناء الويب: npm run build:web ...');
    execSync('npm run build:web', { cwd: rootDir, stdio: 'inherit' });
  } else {
    console.log('نسخة Standalone مبنية وموجودة مسبقاً.');
  }

  logStep('3/5', 'تجهيز وتجميع حزمة المحرك المدمج (apps/desktop/engine)...');
  if (!fs.existsSync(engineDir)) {
    fs.mkdirSync(engineDir, { recursive: true });
  }

  // Copy node.exe
  const targetNode = path.join(engineDir, 'node.exe');
  if (!fs.existsSync(targetNode) || fs.statSync(targetNode).size !== fs.statSync(foundNode).size) {
    console.log(`نسخ node.exe إلى: ${targetNode}`);
    fs.copyFileSync(foundNode, targetNode);
  } else {
    console.log('node.exe موجود مسبقاً ومطابق.');
  }

  // Copy standalone server
  const targetStandalone = path.join(engineDir, 'standalone');
  console.log(`نسخ مجلد الخادم المستقل إلى: ${targetStandalone} ...`);
  fs.cpSync(standaloneWebDir, targetStandalone, { recursive: true });

  // Copy static assets
  const staticSrc = path.join(webDir, '.next', 'static');
  const staticDest1 = path.join(targetStandalone, 'apps', 'web', '.next', 'static');
  const staticDest2 = path.join(targetStandalone, '.next', 'static');
  console.log('نسخ الأصول الثابتة (.next/static)...');
  fs.cpSync(staticSrc, staticDest1, { recursive: true });
  fs.cpSync(staticSrc, staticDest2, { recursive: true });

  // Copy public assets
  const publicSrc = path.join(webDir, 'public');
  if (fs.existsSync(publicSrc)) {
    const publicDest1 = path.join(targetStandalone, 'apps', 'web', 'public');
    const publicDest2 = path.join(targetStandalone, 'public');
    console.log('نسخ مجلد public...');
    fs.cpSync(publicSrc, publicDest1, { recursive: true });
    fs.cpSync(publicSrc, publicDest2, { recursive: true });
  }

  // Copy Prisma client runtime and query engine to standalone node_modules
  const prismaClientSrc = path.join(rootDir, 'node_modules', '.prisma');
  const prismaClientDest = path.join(targetStandalone, 'node_modules', '.prisma');
  if (fs.existsSync(prismaClientSrc)) {
    console.log('نسخ محرك Prisma (.prisma)...');
    fs.cpSync(prismaClientSrc, prismaClientDest, { recursive: true });
  }

  const atPrismaSrc = path.join(rootDir, 'node_modules', '@prisma');
  const atPrismaDest = path.join(targetStandalone, 'node_modules', '@prisma');
  if (fs.existsSync(atPrismaSrc)) {
    console.log('نسخ مكتبة @prisma...');
    fs.cpSync(atPrismaSrc, atPrismaDest, { recursive: true });
  }

  // Copy initial seed data (with clean unlicensed state for new customer installs)
  const dataSrc = path.join(webDir, 'data');
  if (fs.existsSync(dataSrc)) {
    const dataDest = path.join(targetStandalone, 'apps', 'web', 'data');
    console.log('نسخ قاعدة البيانات الأولية والتصنيفات (seed data)...');
    fs.cpSync(dataSrc, dataDest, { recursive: true });
    const directDataDest = path.join(engineDir, 'data');
    fs.cpSync(dataSrc, directDataDest, { recursive: true });

    // Seed SQLite database for new customer installations
    const sqliteDbSrc = path.join(rootDir, 'apps', 'server', 'prisma', 'lab.db');
    if (fs.existsSync(sqliteDbSrc)) {
      console.log('نسخ وتجهيز قاعدة بيانات SQLite المدمجة (lab.db)...');
      try {
        fs.copyFileSync(sqliteDbSrc, path.join(dataDest, 'lab.db'));
        fs.copyFileSync(sqliteDbSrc, path.join(directDataDest, 'lab.db'));
        const altDest = path.join(targetStandalone, 'data');
        if (!fs.existsSync(altDest)) fs.mkdirSync(altDest, { recursive: true });
        fs.copyFileSync(sqliteDbSrc, path.join(altDest, 'lab.db'));
        console.log('✅ تم دمج قاعدة بيانات SQLite (lab.db) ضمن الحزمة المستقلة بنجاح!');
      } catch (err) {
        console.warn('تحذير أثناء نسخ lab.db:', err.message);
      }
    }

    // Ensure bundled seed lab_store.json has zero patients/samples, empty lab profile, and clean license for 7-day trial!
    const bundledStoreFile = path.join(dataDest, 'lab_store.json');
    if (fs.existsSync(bundledStoreFile)) {
      try {
        const storeData = JSON.parse(fs.readFileSync(bundledStoreFile, 'utf-8'));
        delete storeData.license;
        storeData.patients = [];
        storeData.samples = [];
        storeData.expenses = [];
        storeData.doctors = [];
        storeData.incomingResults = [];
        storeData.deviceRawLogs = [];
        if (!storeData.settings) storeData.settings = {};
        storeData.settings.labName = '';
        storeData.settings.labSubtitle = 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل ومعتمد';
        storeData.settings.doctorName = '';
        storeData.settings.doctorTitle = 'استشاري التحليلات المرضية والمناعة السريرية';
        storeData.settings.phone = '';
        storeData.settings.whatsappNumber = '';
        storeData.settings.address = '';
        storeData.settings.reportHeader = '';
        storeData.settings.isConfigured = false;

        const cleanJson = JSON.stringify(storeData, null, 2);
        fs.writeFileSync(bundledStoreFile, cleanJson, 'utf-8');
        fs.writeFileSync(path.join(directDataDest, 'lab_store.json'), cleanJson, 'utf-8');
        const altDest = path.join(targetStandalone, 'data', 'lab_store.json');
        if (fs.existsSync(path.dirname(altDest))) {
          fs.writeFileSync(altDest, cleanJson, 'utf-8');
        }
        console.log('✅ تم تصفير بيانات المرضى والعينات وإعدادات المختبر (صفر بيانات + ظهور لوحة التسجيل للعميل الجديد)!');
      } catch (e) {
        console.warn('تحذير أثناء تصفير بيانات القالب:', e.message);
      }
    }
  }

  logStep('4/5', 'التحقق من سلامة تكوين المحرك المدمج...');
  const checkServer = path.join(targetStandalone, 'apps', 'web', 'server.js');
  if (!fs.existsSync(checkServer)) {
    throw new Error('فشل التحقق: server.js غير موجود في ' + checkServer);
  }
  if (!fs.existsSync(targetNode)) {
    throw new Error('فشل التحقق: node.exe غير موجود في ' + targetNode);
  }
  console.log('✅ تم التحقق: المحرك المستقل وملف الخادم و node.exe جاهزة بالكامل!');

  logStep('5/5', 'حزم وتوليد ملف التثبيت الرسمي النهائي (Setup.exe) عبر electron-builder...');
  console.log('جاري تشغيل electron-builder لحزم تطبيق سطح المكتب بنظام NSIS...');
  
  const shouldPublish = process.argv.includes('--publish') || process.argv.includes('--release');
  if (shouldPublish && !process.env.GH_TOKEN) {
    try {
      const envPath = path.join(rootDir, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/GH_TOKEN=([^\r\n]+)/);
        if (match) {
          process.env.GH_TOKEN = match[1].trim();
        }
      }
    } catch (e) {
      console.warn('تعذر قراءة .env:', e.message);
    }
  }

  const publishFlag = shouldPublish ? '--publish always' : '--publish never';
  execSync(`npx electron-builder --win nsis ${publishFlag}`, { 
    cwd: desktopDir, 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('\n======================================================');
  console.log('  🎉 تم إنجاز بناء ملف التثبيت المستقل بنجاح فائق!');
  console.log('======================================================');

  const distDir = path.join(desktopDir, 'dist');
  const files = fs.readdirSync(distDir);
  const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
  if (setupFile) {
    const setupPath = path.join(distDir, setupFile);
    const sizeMb = (fs.statSync(setupPath).size / (1024 * 1024)).toFixed(2);
    console.log(`\n  📁 مسار ملف التثبيت النهائي:`);
    console.log(`  ${setupPath}`);
    console.log(`\n  📦 الحجم الإجمالي: ${sizeMb} MB`);
    console.log(`\n  هذا الملف هو الوحيد الذي ترسله للعميل، وهو مستقل 100% ولا يحتاج أي برنامج مساند!`);
  }
}

run().catch(err => {
  console.error('\n❌ خطأ أثناء عملية البناء:', err);
  process.exit(1);
});
