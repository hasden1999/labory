#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

const WEB_PORT = 8080;
const rootDir = path.resolve(__dirname, '..');
const desktopExe = path.join(rootDir, 'apps', 'desktop', 'dist', 'win-unpacked', 'Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe');
const desktopAppDir = path.join(rootDir, 'apps', 'desktop');
const unpackedAppJunction = path.join(rootDir, 'apps', 'desktop', 'dist', 'win-unpacked', 'resources', 'app');

function log(msg) {
  console.log(`\x1b[36m[Desktop Dev]\x1b[0m ${msg}`);
}

function checkPort(port, timeoutMs = 200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function checkHealth(port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      try { req.abort(); } catch (e) {}
      resolve(false);
    });
  });
}

async function ensureJunction() {
  if (!fs.existsSync(desktopExe)) {
    log('لم يتم العثور على الحزمة المفكوكة، جاري تشغيل بناء الحزمة الأولية...');
    execSync('npx electron-builder --win --dir', { cwd: desktopAppDir, stdio: 'inherit' });
  }

  if (!fs.existsSync(unpackedAppJunction)) {
    try {
      log('ربط مجلد التطوير بكود سطح المكتب الحي (Junction)...');
      execSync(`cmd /c mklink /J "${unpackedAppJunction}" "${desktopAppDir}"`, { stdio: 'ignore' });
    } catch (e) {
      console.warn('تعذر إنشاء الرابط التلقائي، سيتم الاعتماد على النسخة المباشرة:', e.message);
    }
  }
}

async function startDev() {
  console.log('\n===============================================================');
  console.log('  🚀 بدء وضع المعاينة والتطوير الحي لسطح المكتب (Live Desktop Dev)');
  console.log('===============================================================\n');

  await ensureJunction();

  let webProcess = null;
  const isPortOpen = await checkPort(WEB_PORT);

  if (!isPortOpen) {
    log('تشغيل خادم الواجهة البرمجية المباشر (Next.js Fast Refresh HMR)...');
    const isWin = process.platform === 'win32';
    webProcess = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev', '--workspace=@lab-manager/web'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: isWin,
      env: {
        ...process.env,
        PORT: String(WEB_PORT),
        NODE_ENV: 'development',
      },
    });

    log('جاري انتظار جاهزية خادم التطوير الحي وتصيير الواجهة...');
    let ready = false;
    let portOpenCount = 0;
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const portOpen = await checkPort(WEB_PORT);
      if (portOpen) {
        portOpenCount++;
        const healthy = await checkHealth(WEB_PORT, 2000);
        if (healthy || portOpenCount >= 4) {
          ready = true;
          break;
        }
      }
    }
    if (!ready) {
      console.error('❌ تعذر تشغيل خادم التطوير خلال الوقت المحدد.');
      if (webProcess) webProcess.kill();
      process.exit(1);
    }
  } else {
    log(`الخادم المحلي يعمل مسبقاً على المنفذ ${WEB_PORT} — سيتم ربط نافذة سطح المكتب به مباشرة.`);
  }

  log('فتح نافذة تطبيق سطح المكتب التفاعلية...');
  const quotedExe = `"${desktopExe}"`;
  const desktopProc = spawn(quotedExe, ['--dev'], {
    cwd: desktopAppDir,
    stdio: 'inherit',
    shell: true,
    windowsVerbatimArguments: true,
    env: {
      ...process.env,
      LABRYO_DEV: '1',
    },
  });

  console.log('\n---------------------------------------------------------------');
  console.log('  ✨ المعاينة المباشرة نشطة الآن:');
  console.log('  • أي تعديل في ملفات الواجهة (apps/web/src) سينعكس فورياً في نافذة البرنامج!');
  console.log('  • اضغط F5 لتحديث النافذة يدوياً في أي لحظة.');
  console.log('  • اضغط F12 لفتح شاشة فحص العناصر وأخطاء الكونسول (DevTools).');
  console.log('  • عند إغلاق نافذة البرنامج ستتوقف المعاينة تلقائياً.');
  console.log('---------------------------------------------------------------\n');

  desktopProc.on('exit', () => {
    log('تم إغلاق نافذة سطح المكتب.');
    if (webProcess) {
      log('إيقاف خادم التطوير في الخلفية...');
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${webProcess.pid} /T /F`, { stdio: 'ignore' });
        } else {
          webProcess.kill();
        }
      } catch (e) {}
    }
    process.exit(0);
  });

  process.on('SIGINT', () => {
    try { desktopProc.kill(); } catch (e) {}
    if (webProcess) {
      try { webProcess.kill(); } catch (e) {}
    }
    process.exit(0);
  });
}

startDev().catch((err) => {
  console.error('خطأ غير متوقع:', err);
  process.exit(1);
});
