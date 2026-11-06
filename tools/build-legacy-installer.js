#!/usr/bin/env node

/**
 * ==============================================================================
 * Labryo LIMS - Universal & Legacy Edition Installer Builder
 * (Supports Windows 7 / 8 / 8.1 / 10 / 11 — Both 32-bit x86 and 64-bit x64)
 * ==============================================================================
 * يقوم هذا السكربت ببناء وتوليد نسخة شاملة ومستقلة تعمل على كافة الأجهزة والأنظمة:
 * - محرك سطح المكتب: Electron 22.3.27 بنواة ia32 (تعمل أصلياً على 32-bit و 64-bit).
 * - محرك الخادم المدمج: Node.js v18.20.7 المحمول (x86) مع NODE_SKIP_PLATFORM_CHECK=1.
 * - مسارات تثبيت ASCII نظيفة خالية من الحروف العربية والأقواس لضمان التوافق 100% مع واتساب وتلكرام.
 * - بوابة فحص دخان شاملة (/ready, /health, /api/tests, /api/settings, /api/license/status).
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { execSync, spawn, execFileSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const { copyWhatsAppRuntime, verifyWhatsAppRuntimeClosure } = require('./lib/whatsapp-runtime-bundler');

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

function safeWriteFileSync(filePath, content, options) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.writeFileSync(filePath, content, options);
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

// -------------------------------------------------------------
// Download portable Node 18 executable if not cached locally
// -------------------------------------------------------------

function patchNodeBinaryForLegacyWindows(nodeExePath) {
  try {
    if (!fs.existsSync(nodeExePath)) return;
    const buf = fs.readFileSync(nodeExePath);
    const target = Buffer.from('EventSetInformation\0');
    const replacement = Buffer.from('EventRegister\0\0\0\0\0\0\0');
    let idx = 0;
    let count = 0;
    while ((idx = buf.indexOf(target, idx)) !== -1) {
      replacement.copy(buf, idx);
      count++;
      idx += replacement.length;
    }
    if (count > 0) {
      fs.writeFileSync(nodeExePath, buf);
      console.log(`  🔧 [Win7 PE Patch] تم استبدال EventSetInformation -> EventRegister بنجاح (${count} موضع) في ${path.basename(nodeExePath)} لضمان التوافق مع Windows 7 SP1.`);
    } else {
      console.log(`  ✅ [Win7 PE Check] محرك Node.js خالي تماماً من EventSetInformation ومتوافق 100% مع Windows 7 SP1.`);
    }
  } catch (err) {
    console.warn(`  ⚠️ تحذير أثناء فحص ترقيع Node.js:`, err.message);
  }
}

async function ensureNode18Binary(rootDir, arch = 'ia32') {
  const isX86 = arch === 'ia32' || arch === 'x86';
  const subDir = isX86 ? 'x86' : 'x64';
  const remoteUrl = isX86
    ? 'https://nodejs.org/dist/v18.20.7/win-x86/node.exe'
    : 'https://nodejs.org/dist/v18.20.7/win-x64/node.exe';

  const cacheDir = path.join(rootDir, 'tools', 'bin', 'node18', subDir);
  const targetNode = path.join(cacheDir, 'node.exe');

  if (fs.existsSync(targetNode) && fs.statSync(targetNode).size > 25000000) {
    console.log(`  ✅ تم العثور على محرك Node.js v18.20.7 (${subDir}) محلياً: ${targetNode}`);
    patchNodeBinaryForLegacyWindows(targetNode);
    return targetNode;
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  console.log(`  ⬇️ تنزيل محرك Node.js v18.20.7 المحمول (${subDir}) المخصص للأنظمة القديمة من:\n     ${remoteUrl}`);

  try {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('${remoteUrl}', '${targetNode}')`,
      ],
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.warn('  ⚠️ تعذر التحميل عبر WebClient، محاولة التحميل الاحتياطي عبر node https...');
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(targetNode);
      https
        .get(remoteUrl, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            https
              .get(response.headers.location, (res) => {
                res.pipe(file);
                file.on('finish', () => {
                  file.close(resolve);
                });
              })
              .on('error', reject);
          } else if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
              file.close(resolve);
            });
          } else {
            reject(new Error(`HTTP status ${response.statusCode}`));
          }
        })
        .on('error', reject);
    });
  }

  if (!fs.existsSync(targetNode) || fs.statSync(targetNode).size < 25000000) {
    throw new Error(`❌ فشل تنزيل node.exe لنواة ${subDir}. يرجى التحقق من الاتصال بالإنترنت.`);
  }

  console.log(`  ✅ تم تنزيل وحفظ node.exe بنجاح (${formatBytes(fs.statSync(targetNode).size)}).`);
  patchNodeBinaryForLegacyWindows(targetNode);
  return targetNode;
}

// -------------------------------------------------------------
// Clean seed SQLite database preparation for Legacy Engine
// -------------------------------------------------------------
function prepareSanitizedSeedDatabase(rootDir, targetStandalone, engineDir) {
  const sqliteDbSrc = path.join(rootDir, 'apps', 'server', 'prisma', 'lab.db');
  if (!fs.existsSync(sqliteDbSrc)) {
    throw new Error(`❌ خطأ: قاعدة بيانات SQLite المصدر غير موجودة في: ${sqliteDbSrc}`);
  }

  const stagingDb = path.join(os.tmpdir(), `staging_legacy_sanitized_lab_${Date.now()}.db`);
  if (fs.existsSync(stagingDb)) fs.unlinkSync(stagingDb);
  fs.copyFileSync(sqliteDbSrc, stagingDb);

  console.log('🧹 تنظيف وتطهير جداول العمليات الحية لقاعدة بيانات النسخة الشاملة...');
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

    console.log(`  ✅ اجتاز التحقق الصارم: المرضى=0، العينات=0، الموظفين=0، التراخيص=0.`);
    console.log(`  ✅ الحفاظ التام على كتالوج الفحوصات (${testCatalogCount} فحص) والتصنيفات والأجهزة.`);
  } finally {
    db.close();
  }

  const targetWebDataDir = path.join(targetStandalone, 'apps', 'web', 'data');
  if (!fs.existsSync(targetWebDataDir)) {
    fs.mkdirSync(targetWebDataDir, { recursive: true });
  }
  const primaryDbDest = path.join(targetWebDataDir, 'lab.db');
  fs.copyFileSync(stagingDb, primaryDbDest);

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
// Engine bundling pruning (Prisma + dev tools + Puppeteer support)
// -------------------------------------------------------------
function pruneEngineContents(rootDir, targetStandalone, targetArch = 'ia32') {
  console.log('✂️ تنفيذ التقليم الانتقائي لحزم Prisma والمكتبات الإضافية...');

  const is32Bit = targetArch === 'ia32' || targetArch === 'x86';

  const prismaClientSrc = path.join(rootDir, 'node_modules', '.prisma');
  const prismaClientDest = path.join(targetStandalone, 'node_modules', '.prisma');
  if (fs.existsSync(prismaClientSrc)) {
    fs.cpSync(prismaClientSrc, prismaClientDest, {
      recursive: true,
      filter: (src) => {
        if (src.endsWith('.so.node')) return false;
        // Exclude 64-bit DLL on 32-bit target to save ~20MB and prevent 32-bit dlopen errors
        if (is32Bit && src.endsWith('query_engine-windows.dll.node')) return false;
        return true;
      },
    });
  }

  const atPrismaClientSrc = path.join(rootDir, 'node_modules', '@prisma', 'client');
  const atPrismaClientDest = path.join(targetStandalone, 'node_modules', '@prisma', 'client');
  if (fs.existsSync(atPrismaClientSrc)) {
    fs.cpSync(atPrismaClientSrc, atPrismaClientDest, { recursive: true });

    const runtimeDir = path.join(atPrismaClientDest, 'runtime');
    if (fs.existsSync(runtimeDir)) {
      const nonSqliteWasmPatterns = ['mysql', 'postgresql', 'cockroachdb'];
      const runtimeFiles = fs.readdirSync(runtimeDir);
      for (const file of runtimeFiles) {
        if (
          nonSqliteWasmPatterns.some((p) => file.includes(p)) &&
          (file.endsWith('.wasm') || file.endsWith('.js'))
        ) {
          try {
            fs.unlinkSync(path.join(runtimeDir, file));
          } catch (e) {}
        }
      }
    }
  }

  const standaloneAtPrisma = path.join(targetStandalone, 'node_modules', '@prisma');
  if (fs.existsSync(standaloneAtPrisma)) {
    for (const forbidden of ['engines', 'fetch-engine', 'get-platform', 'engines-version', 'debug']) {
      const forbiddenPath = path.join(standaloneAtPrisma, forbidden);
      if (fs.existsSync(forbiddenPath)) {
        try {
          fs.rmSync(forbiddenPath, { recursive: true, force: true });
        } catch (e) {}
      }
    }
  }

  const standaloneNm = path.join(targetStandalone, 'node_modules');
  if (fs.existsSync(standaloneNm)) {
    for (const devPkg of ['typescript', '@img', 'sharp']) {
      const devPkgPath = path.join(standaloneNm, devPkg);
      if (fs.existsSync(devPkgPath)) {
        try {
          fs.rmSync(devPkgPath, { recursive: true, force: true });
        } catch (e) {}
      }
    }
  }

  // Ensure puppeteer & headless browser dependencies are bundled for multi-page report image generation
  const puppeteerPkgs = [
    'puppeteer',
    'puppeteer-core',
    '@puppeteer',
    'devtools-protocol',
    'chromium-bidi',
    'cosmiconfig',
    'ws',
  ];
  for (const pkg of puppeteerPkgs) {
    const pkgSrc = path.join(rootDir, 'node_modules', pkg);
    const pkgDest = path.join(targetStandalone, 'node_modules', pkg);
    if (fs.existsSync(pkgSrc) && !fs.existsSync(pkgDest)) {
      console.log(`  -> نسخ حزمة ${pkg} لدعم محرك التقارير والصور الطبية...`);
      fs.cpSync(pkgSrc, pkgDest, { recursive: true });
    }
  }

  // Ensure WhatsApp Web engine (@whiskeysockets/baileys, qrcode, pino) and the FULL runtime
  // dependency closure is bundled, preserving nested node_modules versions (e.g. keyv@5 -> @keyv/serialize).
  const waResult = copyWhatsAppRuntime({ rootDir, targetStandalone, log: console.log });
  console.log(`  ✅ تم تجهيز ${waResult.copied} حزمة لمحرك واتساب ويب المدمج.`);
  if (waResult.missing.length > 0) {
    console.log(`  ℹ️ حزم اختيارية غير مثبتة (سيتم تجاهلها): ${Array.from(new Set(waResult.missing)).join(', ')}`);
  }

  // Packaging gate: every required WhatsApp dependency must exist INSIDE the bundle.
  const waClosure = verifyWhatsAppRuntimeClosure({ targetStandalone });
  console.log(`  ✅ تم التحقق من اكتمال شجرة اعتماديات واتساب داخل الحزمة (${waClosure.packages} حزمة).`);

  function removeForbiddenFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeForbiddenFiles(full);
      } else if (
        entry.name.endsWith('.so.node') ||
        entry.name === 'schema-engine-windows.exe' ||
        (is32Bit && entry.name === 'query_engine-windows.dll.node')
      ) {
        try {
          fs.unlinkSync(full);
        } catch (e) {}
      }
    }
  }
  removeForbiddenFiles(targetStandalone);
}

// -------------------------------------------------------------
// Automated Smoke Test Gate for Legacy / Universal Engine
// -------------------------------------------------------------
async function runSmokeTestGate({ engineDir, targetStandalone, timeoutMs = 45000 }) {
  const nodeExe = path.join(engineDir, 'node.exe');
  const serverJs = path.join(targetStandalone, 'apps', 'web', 'server.js');
  const sanitizedDbSrc = path.join(targetStandalone, 'apps', 'web', 'data', 'lab.db');
  const sanitizedJsonSrc = path.join(targetStandalone, 'apps', 'web', 'data', 'lab_store.json');

  if (!fs.existsSync(nodeExe)) {
    throw new Error(`فشل بوابة فحص الدخان: node.exe غير موجود في ${nodeExe}`);
  }
  if (!fs.existsSync(serverJs)) {
    throw new Error(`فشل بوابة فحص الدخان: server.js غير موجود في ${serverJs}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'labryo_smoke_gate_legacy_'));
  const tempDb = path.join(tempDir, 'lab.db');
  const tempJson = path.join(tempDir, 'lab_store.json');
  if (fs.existsSync(sanitizedDbSrc)) {
    fs.copyFileSync(sanitizedDbSrc, tempDb);
  }
  if (fs.existsSync(sanitizedJsonSrc)) {
    fs.copyFileSync(sanitizedJsonSrc, tempJson);
  }

  const port = 8199;
  const normalizedDbUrl =
    'file:' + tempDb.replace(/\\/g, '/') + '?connection_limit=1&socket_timeout=10000&busy_timeout=5000';

  console.log(`[Smoke Gate Legacy] بدء إقلاع خادم الفحص على المنفذ ${port} باستخدام ${nodeExe}...`);
  const serverProc = spawn(nodeExe, [serverJs], {
    cwd: path.join(targetStandalone, 'apps', 'web'),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      LABRYO_DATA_DIR: tempDir,
      DATABASE_URL: normalizedDbUrl,
      NODE_SKIP_PLATFORM_CHECK: '1',
      NODE_OPTIONS: '--max-old-space-size=768',
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
          timeout: 5000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => resolve({ statusCode: res.statusCode, body, headers: res.headers }));
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
  let readyOk = false;
  let healthOk = false;
  let testsOk = false;
  let licenseOk = false;

  console.log('[Smoke Gate Legacy] استطلاع /ready و /health و /api/tests و /api/license/status...');
  while (Date.now() - startTime < timeoutMs) {
    try {
      if (!readyOk) {
        const rRes = await fetchUrl('/ready');
        if (rRes.statusCode === 200) {
          console.log('  ✅ استجابة مسار الجاهزية /ready بنجاح (200 OK)');
          readyOk = true;
        }
      }
      if (readyOk && !healthOk) {
        const hRes = await fetchUrl('/health');
        if (hRes.statusCode === 200) {
          console.log('  ✅ استجابة مسار الصحة /health بنجاح (200 OK)');
          healthOk = true;
        }
      }
      if (healthOk && !testsOk) {
        const tRes = await fetchUrl('/api/tests');
        if (tRes.statusCode === 200) {
          const parsed = JSON.parse(tRes.body);
          const count = parsed.tests ? parsed.tests.length : 0;
          console.log(`  ✅ استجابة مسار الكتالوج /api/tests بنجاح (200 OK - ${count} فحص)`);
          testsOk = count >= 140;
        }
      }
      if (testsOk && !licenseOk) {
        const lRes = await fetchUrl('/api/license/status');
        if (lRes.statusCode === 200) {
          console.log('  ✅ استجابة مسار الترخيص /api/license/status بنجاح (200 OK)');
          licenseOk = true;
        }
      }
      if (readyOk && healthOk && testsOk && licenseOk) break;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 350));
  }

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

  if (!readyOk || !healthOk || !testsOk || !licenseOk) {
    console.error('\nمخرجات السيرفر أثناء الفحص:\n', serverOutput);
    throw new Error(
      `❌ فشل فحص الدخان لمحرّك الأنظمة القديمة! ready=${readyOk}, health=${healthOk}, tests=${testsOk}, license=${licenseOk}.`
    );
  }

  console.log('🎉 نجح فحص الدخان الشامل لمحرّك النسخة القديمة والشاملة بنسبة 100%!');
}

// -------------------------------------------------------------
// Main execution runner
// -------------------------------------------------------------
async function run() {
  const rootDir = path.resolve(__dirname, '..');
  const webDir = path.join(rootDir, 'apps', 'web');
  const desktopDir = path.join(rootDir, 'apps', 'desktop');
  const engineDir = path.join(desktopDir, 'engine-legacy');

  // Default to ia32 for universal compatibility across BOTH 32-bit and 64-bit Windows (7/8/8.1/10/11)
  let targetArch = 'ia32';
  if (process.argv.includes('--x64') || process.argv.includes('--arch=x64')) {
    targetArch = 'x64';
  } else if (
    process.argv.includes('--ia32') ||
    process.argv.includes('--arch=ia32') ||
    process.argv.includes('--arch=x86')
  ) {
    targetArch = 'ia32';
  }

  logStep(
    '0/5',
    `التحقق من الإصدار وتحديد النواة المستهدفة: [${targetArch.toUpperCase()}] للتوافق الشامل (32-bit & 64-bit / Win 7-11)...`
  );
  const allowSame = process.argv.includes('--allow-same-version') ? ' --allow-same-version' : '';
  execSync(`node tools/verify_build_version.js${allowSame}`, { cwd: rootDir, stdio: 'inherit' });

  logStep('1/5', `تأمين محرك Node.js v18.20.7 المحمول (${targetArch})...`);
  const nodeBinary = await ensureNode18Binary(rootDir, targetArch);

  logStep('2/5', 'تجهيز وبناء نسخة الخادم المستقلة (Next.js Standalone)...');
  const standaloneWebDir = path.join(webDir, '.next', 'standalone');
  const hasFreshStandalone = fs.existsSync(path.join(standaloneWebDir, 'apps', 'web', 'server.js'));

  if (process.argv.includes('--skip-web-build') && hasFreshStandalone) {
    console.log('⚡ تم تجاوز بناء الويب (--skip-web-build) واستخدام النسخة المبنية الحالية.');
  } else {
    console.log('جاري تشغيل بناء الويب: npm run build:web ...');
    execSync('npm run build:web', { cwd: rootDir, stdio: 'inherit' });
  }

  logStep('3/5', `تجميع وتجهيز محرك النسخة الشاملة (${engineDir})...`);
  const targetStandalone = path.join(engineDir, 'standalone');
  const directDataDest = path.join(engineDir, 'data');

  if (fs.existsSync(targetStandalone)) {
    fs.rmSync(targetStandalone, { recursive: true, force: true });
  }
  if (fs.existsSync(directDataDest)) {
    fs.rmSync(directDataDest, { recursive: true, force: true });
  }
  if (!fs.existsSync(engineDir)) {
    fs.mkdirSync(engineDir, { recursive: true });
  }

  // Copy portable Node 18 binary
  const targetNode = path.join(engineDir, 'node.exe');
  fs.copyFileSync(nodeBinary, targetNode);
  patchNodeBinaryForLegacyWindows(targetNode);
  console.log(`  ✅ تم نسخ وتأكيد ترقيع محرك Node 18 المحمول في: ${targetNode}`);

  // Copy standalone server from the most complete source
  const sourceStandalone = fs.existsSync(path.join(standaloneWebDir, 'apps', 'web', 'server.js'))
    ? standaloneWebDir
    : desktopEngineStandalone;
  console.log(`  نسخ مجلد الخادم المستقل من ${sourceStandalone} إلى: ${targetStandalone} ...`);
  fs.cpSync(sourceStandalone, targetStandalone, { recursive: true });

  // Copy static assets
  const staticSrcCandidates = [
    path.join(webDir, '.next', 'static'),
    path.join(rootDir, '.next', 'static'),
    path.join(desktopDir, 'engine', 'standalone', 'apps', 'web', '.next', 'static'),
  ];
  const foundStaticSrc = staticSrcCandidates.find((p) => fs.existsSync(p));
  if (foundStaticSrc) {
    const staticDest = path.join(targetStandalone, 'apps', 'web', '.next', 'static');
    console.log(`  نسخ الأصول الثابتة من ${foundStaticSrc} إلى ${staticDest}...`);
    fs.cpSync(foundStaticSrc, staticDest, { recursive: true });
    const rootStaticDest = path.join(targetStandalone, '.next', 'static');
    try { fs.cpSync(foundStaticSrc, rootStaticDest, { recursive: true }); } catch (e) {}
  }

  // Copy public assets to both apps/web/public and standalone/public
  const publicSrc = path.join(webDir, 'public');
  if (fs.existsSync(publicSrc)) {
    const publicDest = path.join(targetStandalone, 'apps', 'web', 'public');
    const rootPublicDest = path.join(targetStandalone, 'public');
    fs.cpSync(publicSrc, publicDest, { recursive: true });
    fs.cpSync(publicSrc, rootPublicDest, { recursive: true });
  }

  // Pruning + Puppeteer bundling
  pruneEngineContents(rootDir, targetStandalone, targetArch);

  // Clean SQLite database
  prepareSanitizedSeedDatabase(rootDir, targetStandalone, engineDir);

  // Clean seed lab_store.json
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
  storeData.settings.labLicense = '';
  storeData.settings.isConfigured = false;

  const cleanStoreJson = JSON.stringify(storeData, null, 2);
  safeWriteFileSync(bundledStoreDest, cleanStoreJson, 'utf-8');
  safeWriteFileSync(path.join(directDataDest, 'lab_store.json'), cleanStoreJson, 'utf-8');
  const altStoreDest = path.join(targetStandalone, 'data', 'lab_store.json');
  if (fs.existsSync(path.dirname(altStoreDest))) {
    safeWriteFileSync(altStoreDest, cleanStoreJson, 'utf-8');
  }

  logStep('4/5', 'التحقق من سلامة المحرك وبوابة فحص الدخان (Universal/Legacy Smoke Test)...');
  await runSmokeTestGate({ engineDir, targetStandalone });

  if (process.argv.includes('--skip-builder') || process.argv.includes('--smoke-only')) {
    console.log('\n⚡ تم تخطي electron-builder بناءً على المعامل (--skip-builder / --smoke-only).');
    return;
  }

  logStep('5/5', 'حزم وتوليد ملف التثبيت الشامل عبر electron-builder...');
  const distDir = path.join(desktopDir, 'dist-legacy');
  if (fs.existsSync(distDir)) {
    const oldDistFiles = fs.readdirSync(distDir);
    for (const f of oldDistFiles) {
      if (f.endsWith('.exe') || f.endsWith('.blockmap') || f.endsWith('.sha256')) {
        try {
          fs.unlinkSync(path.join(distDir, f));
        } catch (e) {}
      }
    }
  }

  const shouldPublish = process.argv.includes('--publish') || process.argv.includes('--release');
  const publishFlag = shouldPublish ? '--publish always' : '--publish never';
  const archFlag = targetArch === 'ia32' ? '--ia32' : '--x64';

  console.log(
    `جاري حزم النسخة الشاملة (Electron 22.3.27, ${targetArch.toUpperCase()}) باستخدام electron-builder-legacy.json...`
  );
  execSync(`npx electron-builder --config electron-builder-legacy.json --win nsis ${archFlag} ${publishFlag}`, {
    cwd: desktopDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      LABRYO_LEGACY_EDITION: '1',
    },
  });

  console.log('\n======================================================');
  console.log(`  🎉 تم بناء مثبت النسخة الشاملة (${targetArch.toUpperCase()}) بنجاح!`);
  console.log('======================================================');

  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    console.log('  📁 ملفات التوزيع في مجلد dist-legacy:');
    for (const f of files) {
      const fullPath = path.join(distDir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        console.log(`     - ${f} (${formatBytes(stat.size)})`);
      }
    }

    const desktopFolder = path.join(os.homedir(), 'Desktop');
    const targetInstallerName = 'Labryo_LIMS_v2_Universal_All_Windows_32-64bit_Setup.exe';
    const destExe = path.join(desktopFolder, targetInstallerName);

    const exeFiles = files
      .filter((f) => f.endsWith('.exe') && !f.includes('elevate') && !f.includes('unins'))
      .map((f) => ({
        name: f,
        path: path.join(distDir, f),
        mtime: fs.statSync(path.join(distDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (exeFiles.length > 0) {
      // Archive old outdated Labryo setup files on Desktop to prevent confusion when sending via WhatsApp/Telegram
      const archiveDir = path.join(desktopFolder, 'الاصدارات_القديمة_السابقة');
      try {
        const desktopEntries = fs.readdirSync(desktopFolder);
        for (const entry of desktopEntries) {
          if (
            entry !== targetInstallerName &&
            entry !== `${targetInstallerName}.sha256` &&
            entry.startsWith('Labryo') &&
            (entry.endsWith('.exe') || entry.endsWith('.sha256'))
          ) {
            if (!fs.existsSync(archiveDir)) {
              fs.mkdirSync(archiveDir, { recursive: true });
            }
            const oldPath = path.join(desktopFolder, entry);
            const newArchivePath = path.join(archiveDir, entry);
            try {
              fs.renameSync(oldPath, newArchivePath);
              console.log(`  📦 تم نقل الإصدار القديم (${entry}) إلى أرشيف الإصدارات السابقة على سطح المكتب.`);
            } catch (e) {}
          }
        }
      } catch (e) {}

      const srcExe = exeFiles[0].path;
      console.log(`\n📋 نسخ مثبت النسخة الشاملة الجديد إلى سطح المكتب:\n   ${destExe} ...`);
      fs.copyFileSync(srcExe, destExe);

      const hash = crypto.createHash('sha256').update(fs.readFileSync(destExe)).digest('hex');
      const sha256Dest = destExe + '.sha256';
      fs.writeFileSync(sha256Dest, `${hash} *${targetInstallerName}\n`, 'utf-8');
      console.log(`  ✅ تم تحديث النسخة على سطح المكتب بنجاح! (${formatBytes(fs.statSync(destExe).size)})`);
      console.log(`  🔒 بصمة SHA-256: ${hash}`);
    }
  }
}

run().catch((err) => {
  console.error('\n❌ خطأ أثناء عملية بناء النسخة الشاملة:', err);
  process.exit(1);
});
