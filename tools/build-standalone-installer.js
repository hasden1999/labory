#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { execSync, spawn, execFileSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

function logStep(step, message) {
  console.log(`\n======================================================`);
  console.log(`  [${step}] ${message}`);
  console.log(`======================================================`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// -------------------------------------------------------------
// Phase 1 (P0): Clean seed SQLite database preparation
// -------------------------------------------------------------
function prepareSanitizedSeedDatabase(rootDir, targetStandalone, engineDir) {
  const sqliteDbSrc = path.join(rootDir, 'apps', 'server', 'prisma', 'lab.db');
  if (!fs.existsSync(sqliteDbSrc)) {
    throw new Error(`❌ خطأ: قاعدة بيانات SQLite المصدر غير موجودة في: ${sqliteDbSrc}`);
  }

  const stagingDb = path.join(os.tmpdir(), `staging_sanitized_lab_${Date.now()}.db`);
  if (fs.existsSync(stagingDb)) fs.unlinkSync(stagingDb);
  fs.copyFileSync(sqliteDbSrc, stagingDb);

  console.log('🧹 تنظيف وتطهير جداول العمليات الحية (Operational Tables) لقاعدة بيانات العميل الجديد...');
  const db = new DatabaseSync(stagingDb);

  const operationalTables = [
    'Patient',
    'Sample',
    'SampleTest',
    'FinancialTransaction',
    'DebtRecord',
    'Debtor',
    'Expense',
    'CashDrawerShift',
    'InventoryTransaction',
    'IncomingResult',
    'DeviceRawLog',
    'Staff',
    'License',
    'ReferringDoctor',
    'ResultArchive',
    'AuditLog',
  ];

  try {
    db.exec('PRAGMA foreign_keys = OFF;');

    for (const tbl of operationalTables) {
      db.exec(`DELETE FROM "${tbl}";`);
    }

    db.exec(`
      UPDATE "Settings" 
      SET labName='', doctorName='', phone='', whatsappNumber='', address='', reportHeader='', reportFooter='', labLicense='';
    `);

    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('VACUUM;');

    // Strict assertion checks
    const patientCount = db.prepare('SELECT count(*) as c FROM "Patient"').get().c;
    const sampleCount = db.prepare('SELECT count(*) as c FROM "Sample"').get().c;
    const staffCount = db.prepare('SELECT count(*) as c FROM "Staff"').get().c;
    const licenseCount = db.prepare('SELECT count(*) as c FROM "License"').get().c;
    const testCatalogCount = db.prepare('SELECT count(*) as c FROM "TestCatalog"').get().c;

    if (patientCount !== 0 || sampleCount !== 0 || staffCount !== 0 || licenseCount !== 0) {
      throw new Error(
        `❌ فشل التحقق الصارم: الجداول التشغيلية ليست فارغة! Patient: ${patientCount}, Sample: ${sampleCount}, Staff: ${staffCount}, License: ${licenseCount}`
      );
    }

    if (testCatalogCount < 140) {
      throw new Error(
        `❌ فشل التحقق الصارم: عدد فحوصات الكتالوج أقل من 140 (الحالي: ${testCatalogCount})!`
      );
    }

    for (const tbl of operationalTables) {
      const c = db.prepare(`SELECT count(*) as c FROM "${tbl}"`).get().c;
      if (c !== 0) {
        throw new Error(`❌ فشل التحقق الصارم: الجدول "${tbl}" يحتوي على ${c} سجل بعد التطهير!`);
      }
    }

    console.log(`  ✅ اجتاز التحقق الصارم: المرضى=0، العينات=0، الموظفين=0، التراخيص=0.`);
    console.log(`  ✅ الحفاظ التام على كتالوج الفحوصات (${testCatalogCount} فحص) والتصنيفات والأجهزة.`);
    console.log(`  ✅ تصفير بيانات ملف المختبر في Settings بنجاح.`);
  } finally {
    db.close();
  }

  // Place sanitized database at targetStandalone/apps/web/data/lab.db
  const targetWebDataDir = path.join(targetStandalone, 'apps', 'web', 'data');
  if (!fs.existsSync(targetWebDataDir)) {
    fs.mkdirSync(targetWebDataDir, { recursive: true });
  }
  const primaryDbDest = path.join(targetWebDataDir, 'lab.db');
  fs.copyFileSync(stagingDb, primaryDbDest);
  console.log(`  ✅ تم وضع قاعدة البيانات المطهرة في: ${primaryDbDest}`);

  // Also populate candidate fallback directories
  const altDataDir = path.join(targetStandalone, 'data');
  if (!fs.existsSync(altDataDir)) fs.mkdirSync(altDataDir, { recursive: true });
  fs.copyFileSync(stagingDb, path.join(altDataDir, 'lab.db'));

  const directEngineDataDir = path.join(engineDir, 'data');
  if (!fs.existsSync(directEngineDataDir)) fs.mkdirSync(directEngineDataDir, { recursive: true });
  fs.copyFileSync(stagingDb, path.join(directEngineDataDir, 'lab.db'));

  try {
    fs.unlinkSync(stagingDb);
  } catch (e) {}
}

// -------------------------------------------------------------
// Phase 2: Engine bundling pruning
// -------------------------------------------------------------
function pruneEngineContents(rootDir, targetStandalone) {
  console.log('✂️ تنفيذ التقليم الانتقائي لحزم Prisma والمكتبات الإضافية...');

  // 1. Copy .prisma/client while excluding Linux binaries (*.so.node)
  const prismaClientSrc = path.join(rootDir, 'node_modules', '.prisma');
  const prismaClientDest = path.join(targetStandalone, 'node_modules', '.prisma');
  if (fs.existsSync(prismaClientSrc)) {
    console.log('  -> نسخ محرك Prisma (.prisma) مع استبعاد ثنائيات لينكس (*.so.node)...');
    fs.cpSync(prismaClientSrc, prismaClientDest, {
      recursive: true,
      filter: (src) => !src.endsWith('.so.node'),
    });
  }

  // 2. Copy @prisma/client runtime only (NOT @prisma/engines, fetch-engine, get-platform)
  const atPrismaClientSrc = path.join(rootDir, 'node_modules', '@prisma', 'client');
  const atPrismaClientDest = path.join(targetStandalone, 'node_modules', '@prisma', 'client');
  if (fs.existsSync(atPrismaClientSrc)) {
    console.log('  -> نسخ مكتبة @prisma/client...');
    fs.cpSync(atPrismaClientSrc, atPrismaClientDest, { recursive: true });

    // Prune non-sqlite wasm binaries from runtime
    const runtimeDir = path.join(atPrismaClientDest, 'runtime');
    if (fs.existsSync(runtimeDir)) {
      const nonSqliteWasmPatterns = ['mysql', 'postgresql', 'cockroachdb'];
      const runtimeFiles = fs.readdirSync(runtimeDir);
      for (const file of runtimeFiles) {
        if (nonSqliteWasmPatterns.some((p) => file.includes(p)) && (file.endsWith('.wasm') || file.endsWith('.js'))) {
          const filePath = path.join(runtimeDir, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`     ✂️ استبعاد ملف wasm غير مستخدم: ${file}`);
          } catch (e) {}
        }
      }
    }
  }

  // 3. Ensure unneeded @prisma cache/tools are strictly removed if copied by standalone
  const standaloneAtPrisma = path.join(targetStandalone, 'node_modules', '@prisma');
  if (fs.existsSync(standaloneAtPrisma)) {
    for (const forbidden of ['engines', 'fetch-engine', 'get-platform', 'engines-version', 'debug']) {
      const forbiddenPath = path.join(standaloneAtPrisma, forbidden);
      if (fs.existsSync(forbiddenPath)) {
        console.log(`     ✂️ إزالة مجلد @prisma/${forbidden} غير المطلوب للتشغيل الإنتاجي...`);
        fs.rmSync(forbiddenPath, { recursive: true, force: true });
      }
    }
  }

  // 4. Prune dev tools and heavy packages from standalone node_modules
  const standaloneNm = path.join(targetStandalone, 'node_modules');
  if (fs.existsSync(standaloneNm)) {
    for (const devPkg of ['typescript', '@img', 'sharp']) {
      const devPkgPath = path.join(standaloneNm, devPkg);
      if (fs.existsSync(devPkgPath)) {
        console.log(`     ✂️ تقليم حزمة التطوير ${devPkg} من node_modules المدمجة...`);
        fs.rmSync(devPkgPath, { recursive: true, force: true });
      }
    }
  }

  // 5. Recursive safety cleanup: remove any stray *.so.node or schema-engine-windows.exe
  function removeForbiddenFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeForbiddenFiles(full);
      } else if (entry.name.endsWith('.so.node') || entry.name === 'schema-engine-windows.exe') {
        try {
          fs.unlinkSync(full);
          console.log(`     ✂️ حذف ملف محظور: ${entry.name}`);
        } catch (e) {}
      }
    }
  }
  removeForbiddenFiles(targetStandalone);
}

// -------------------------------------------------------------
// Phase 2: Automated Smoke Test Gate
// -------------------------------------------------------------
async function runSmokeTestGate({ engineDir, targetStandalone, timeoutMs = 10000 }) {
  const nodeExe = path.join(engineDir, 'node.exe');
  const serverJs = path.join(targetStandalone, 'apps', 'web', 'server.js');
  const sanitizedDbSrc = path.join(targetStandalone, 'apps', 'web', 'data', 'lab.db');

  if (!fs.existsSync(nodeExe)) {
    throw new Error(`فشل بوابة فحص الدخان: node.exe غير موجود في ${nodeExe}`);
  }
  if (!fs.existsSync(serverJs)) {
    throw new Error(`فشل بوابة فحص الدخان: server.js غير موجود في ${serverJs}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'labryo_smoke_gate_'));
  const tempDb = path.join(tempDir, 'lab.db');
  if (fs.existsSync(sanitizedDbSrc)) {
    fs.copyFileSync(sanitizedDbSrc, tempDb);
  } else {
    throw new Error(`فشل بوابة فحص الدخان: lab.db المطهرة غير موجودة في ${sanitizedDbSrc}`);
  }

  const port = 8198;
  const normalizedDbUrl =
    'file:' + tempDb.replace(/\\/g, '/') + '?connection_limit=1&socket_timeout=10000&busy_timeout=5000';

  console.log(`[Smoke Gate] بدء إقلاع خادم الفحص الآلي على المنفذ ${port} باستخدام ${nodeExe}...`);
  const serverProc = spawn(nodeExe, [serverJs], {
    cwd: path.join(targetStandalone, 'apps', 'web'),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      LABRYO_DATA_DIR: tempDir,
      DATABASE_URL: normalizedDbUrl,
    },
    stdio: 'pipe',
  });

  let serverOutput = '';
  serverProc.stdout.on('data', (d) => {
    serverOutput += d.toString();
  });
  serverProc.stderr.on('data', (d) => {
    serverOutput += d.toString();
  });

  function fetchUrl(pathname) {
    return new Promise((resolve, reject) => {
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port,
          path: pathname,
          timeout: 2000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('timeout'));
      });
    });
  }

  const startTime = Date.now();
  let healthOk = false;
  let testsOk = false;

  console.log('[Smoke Gate] استطلاع /health و /api/tests (الحد الأقصى 10 ثوان)...');
  while (Date.now() - startTime < timeoutMs) {
    try {
      if (!healthOk) {
        const hRes = await fetchUrl('/health');
        if (hRes.statusCode === 200) {
          console.log('  ✅ استجابة مسار الصحة /health بنجاح (200 OK)');
          healthOk = true;
        }
      }
      if (healthOk && !testsOk) {
        const tRes = await fetchUrl('/api/tests');
        if (tRes.statusCode === 200) {
          let parsed = {};
          try {
            parsed = JSON.parse(tRes.body);
          } catch (e) {}
          const count = parsed.tests ? parsed.tests.length : 'OK';
          console.log(`  ✅ استجابة مسار الكتالوج /api/tests بنجاح (200 OK) - عدد الفحوصات: ${count}`);
          testsOk = true;
        }
      }
      if (healthOk && testsOk) break;
    } catch (e) {
      // Waiting for server to boot
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // Clean termination of the smoke test process
  console.log('[Smoke Gate] إنهاء عملية الفحص وتحرير المنفذ...');
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${serverProc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      serverProc.kill('SIGKILL');
    }
  } catch (e) {}

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  if (!healthOk || !testsOk) {
    console.error('\nمخرجات السيرفر أثناء الفحص:\n', serverOutput);
    throw new Error(
      `❌ فشل فحص الدخان الآلي (Smoke Test Gate)! healthOk=${healthOk}, testsOk=${testsOk}. تم إيقاف الحزم لمنع إصدار حزمة تالفة.`
    );
  }

  console.log('🎉 نجح فحص الدخان بنسبة 100%! المحرك المدمج سليم وجاهز للحزم النهائي.');
}

async function run() {
  const rootDir = path.resolve(__dirname, '..');
  const webDir = path.join(rootDir, 'apps', 'web');
  const desktopDir = path.join(rootDir, 'apps', 'desktop');
  const engineDir = path.join(desktopDir, 'engine');

  logStep('0/5', 'التحقق الصارم من رقم الإصدار وتوافقه مع السيرفر...');
  const allowSame = process.argv.includes('--allow-same-version') ? ' --allow-same-version' : '';
  execSync(`node tools/verify_build_version.js${allowSame}`, { cwd: rootDir, stdio: 'inherit' });

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
  if (process.argv.includes('--skip-web-build') && fs.existsSync(standaloneWebDir)) {
    console.log('⚡ تم تجاوز بناء الويب (--skip-web-build) واستخدام النسخة المبنية الحالية في .next/standalone.');
  } else {
    console.log('جاري تشغيل بناء الويب: npm run build:web ...');
    execSync('npm run build:web', { cwd: rootDir, stdio: 'inherit' });
  }

  logStep('3/5', 'تجهيز وتجميع حزمة المحرك المدمج النظيف (apps/desktop/engine)...');
  const targetStandalone = path.join(engineDir, 'standalone');
  const directDataDest = path.join(engineDir, 'data');

  // Clean stale engine contents before bundling
  if (fs.existsSync(targetStandalone)) {
    console.log(`تنظيف المحتويات القديمة من: ${targetStandalone} ...`);
    fs.rmSync(targetStandalone, { recursive: true, force: true });
  }
  if (fs.existsSync(directDataDest)) {
    console.log(`تنظيف مجلد البيانات القديم من: ${directDataDest} ...`);
    fs.rmSync(directDataDest, { recursive: true, force: true });
  }
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
  console.log(`نسخ مجلد الخادم المستقل إلى: ${targetStandalone} ...`);
  fs.cpSync(standaloneWebDir, targetStandalone, { recursive: true });

  // Copy static assets once into targetStandalone/apps/web/.next/static
  const staticSrc = path.join(webDir, '.next', 'static');
  const staticDest = path.join(targetStandalone, 'apps', 'web', '.next', 'static');
  console.log('نسخ الأصول الثابتة (.next/static)...');
  fs.cpSync(staticSrc, staticDest, { recursive: true });

  // Copy public assets once into targetStandalone/apps/web/public
  const publicSrc = path.join(webDir, 'public');
  if (fs.existsSync(publicSrc)) {
    const publicDest = path.join(targetStandalone, 'apps', 'web', 'public');
    console.log('نسخ مجلد public...');
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  // Phase 2: Engine bundling pruning (Prisma + dev tools)
  pruneEngineContents(rootDir, targetStandalone);

  // Phase 1 (P0): Clean seed SQLite database preparation for customer installations
  prepareSanitizedSeedDatabase(rootDir, targetStandalone, engineDir);

  // Bundled seed lab_store.json (zero patients, empty lab profile)
  const bundledStoreDest = path.join(targetStandalone, 'apps', 'web', 'data', 'lab_store.json');
  const storeDataSrc = path.join(webDir, 'data', 'lab_store.json');
  let storeData = {};
  if (fs.existsSync(storeDataSrc)) {
    try {
      storeData = JSON.parse(fs.readFileSync(storeDataSrc, 'utf-8'));
    } catch (e) {}
  }
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

  const cleanStoreJson = JSON.stringify(storeData, null, 2);
  fs.writeFileSync(bundledStoreDest, cleanStoreJson, 'utf-8');
  fs.writeFileSync(path.join(directDataDest, 'lab_store.json'), cleanStoreJson, 'utf-8');
  const altStoreDest = path.join(targetStandalone, 'data', 'lab_store.json');
  if (fs.existsSync(path.dirname(altStoreDest))) {
    fs.writeFileSync(altStoreDest, cleanStoreJson, 'utf-8');
  }
  console.log('✅ تم تجهيز وحفظ lab_store.json الأولي بصفر بيانات للعميل الجديد.');

  logStep('4/5', 'التحقق من سلامة تكوين المحرك وبوابة فحص الدخان (Smoke Test Gate)...');
  const checkServer = path.join(targetStandalone, 'apps', 'web', 'server.js');
  if (!fs.existsSync(checkServer)) {
    throw new Error('فشل التحقق: server.js غير موجود في ' + checkServer);
  }
  if (!fs.existsSync(targetNode)) {
    throw new Error('فشل التحقق: node.exe غير موجود في ' + targetNode);
  }

  // Execute Smoke Test Gate (port 8198, /health, /api/tests, max 10s)
  await runSmokeTestGate({ engineDir, targetStandalone });

  // Optional: Skip builder if requested for smoke-only testing
  if (process.argv.includes('--skip-builder') || process.argv.includes('--smoke-only')) {
    console.log('\n⚡ تم تخطي electron-builder بناءً على المعامل (--skip-builder / --smoke-only).');
    try {
      require('./measure-footprint').measure();
    } catch (e) {}
    return;
  }

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
          process.env.GITHUB_TOKEN = match[1].trim();
        }
      }
    } catch (e) {
      console.warn('تعذر قراءة .env:', e.message);
    }
  } else if (shouldPublish && process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    process.env.GITHUB_TOKEN = process.env.GH_TOKEN;
  }

  const publishFlag = shouldPublish ? '--publish always' : '--publish never';
  execSync(`npx electron-builder --win nsis ${publishFlag}`, {
    cwd: desktopDir,
    stdio: 'inherit',
    env: { ...process.env },
  });

  console.log('\n======================================================');
  console.log('  🎉 تم إنجاز بناء ملف التثبيت المستقل بنجاح فائق!');
  console.log('======================================================');

  const distDir = path.join(desktopDir, 'dist');
  const targetVersion = require(path.join(rootDir, 'package.json')).version;
  const files = fs.readdirSync(distDir);
  const setupFile = files.find(
    (f) =>
      f.endsWith('.exe') &&
      !f.includes('Portable') &&
      !f.startsWith('Labryo.LIMS.Setup.') &&
      f.includes('Setup') &&
      f.includes(targetVersion)
  );

  if (!setupFile) {
    throw new Error(`❌ خطأ جسيم: لم يتم العثور على ملف مثبت Setup.exe يحمل الإصدار ${targetVersion} بعد اكتمال البناء!`);
  }

  const setupPath = path.join(distDir, setupFile);
  let peVersion = '';
  try {
    peVersion = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `(Get-Item -LiteralPath '${setupPath}').VersionInfo.ProductVersion`],
      { encoding: 'utf-8' }
    ).trim();
  } catch (e) {
    throw new Error(`فشل فحص ترويسة ملف التثبيت: ${e.message}`);
  }

  if (peVersion !== targetVersion) {
    throw new Error(`❌ خطأ جسيم: ترويسة ملف التثبيت المترجم (${peVersion}) لا تطابق الإصدار المطلوب (${targetVersion})!`);
  }

  const sizeMb = (fs.statSync(setupPath).size / (1024 * 1024)).toFixed(2);
  console.log(`\n  📁 مسار ملف التثبيت النهائي المعتمد:`);
  console.log(`  ${setupPath}`);
  console.log(`  🔍 رقم الإصدار الموثق داخلياً: ${peVersion}`);
  console.log(`  📦 الحجم الإجمالي: ${sizeMb} MB`);
  console.log(`\n  هذا الملف هو الوحيد الذي ترسله للعميل، وهو مستقل 100% ولا يحتاج أي برنامج مساند!`);

  // Measure final footprint
  try {
    console.log('\nقياس البصمة التخزينية النهائية بعد التثبيت:');
    require('./measure-footprint').measure();
  } catch (e) {}
}

run().catch((err) => {
  console.error('\n❌ خطأ أثناء عملية البناء:', err);
  process.exit(1);
});
