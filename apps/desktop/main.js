class StartupTracer {
  constructor() {
    this.startNs = process.hrtime.bigint();
    this.checkpoints = [];
  }

  mark(label) {
    const nowNs = process.hrtime.bigint();
    const elapsedMs = Number(nowNs - this.startNs) / 1e6;
    const formatted = `+${elapsedMs.toFixed(1)}ms`;
    this.checkpoints.push({ label, elapsedMs: parseFloat(elapsedMs.toFixed(1)) });
    console.log(`⏱️ [STARTUP] ${formatted.padStart(9)} -> ${label}`);
  }

  summary() {
    console.log('\n================ STARTUP PERFORMANCE AUDIT ================');
    console.table(this.checkpoints);
    console.log('===========================================================\n');
  }
}

const tracer = new StartupTracer();
tracer.mark('Process Entry (T0)');

const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');

// Hardware Acceleration & Direct3D 11/12 GPU Compositor (Fast 60fps Native Rendering)
const isSafeMode = process.argv.includes('--safe-mode') || process.env.LABRYO_SAFE_MODE === '1';
if (isSafeMode) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
} else {
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
}
app.commandLine.appendSwitch('no-sandbox');

// Enforce single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let splashWindow = null;
let backendProcess = null;
let tray = null;
let isQuitting = false;
let isShuttingDown = false; // Atomic idempotency lock for instant zero-lag teardown
let hasShownTrayNotice = false;
let isPreWarmed = false;
let isStartingUp = false;
const WEB_PORT = 8080;

let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  console.warn('[Desktop] electron-updater not loaded:', e.message);
}

function initAutoUpdater() {
  if (!autoUpdater || !app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates via GitHub Releases...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    try {
      if (Notification && Notification.isSupported()) {
        new Notification({
          title: 'نظام لابريو الطبي - تحديث جديد',
          body: `تم اكتشاف الإصدار (${info.version})، يجري تنزيله تلقائياً في الخلفية...`,
          icon: getTrayIcon(),
        }).show();
      }
    } catch (e) {
      console.warn('[AutoUpdater] Notification error:', e?.message);
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] System is up to date.');
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Update check failed (offline or network unreachable):', err?.message || err);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
    dialog.showMessageBox(mainWindow || undefined, {
      type: 'info',
      title: 'تحديث جديد لنظام لابريو الطبي',
      message: `تم تنزيل الإصدار الجديد (${info.version}) بنجاح!`,
      detail: 'هل تريد إعادة تشغيل البرنامج الآن لتطبيق التحديث؟',
      buttons: ['إعادة التشغيل الآن', 'لاحقاً عند الإغلاق'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.hide();
        }
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.destroy();
          splashWindow = null;
        }
        isQuitting = true;
        killBackendProcess();
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Delay initial check by 15 seconds after launch to ensure smooth startup
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.warn('[AutoUpdater] Silent check warning:', err?.message);
    });
  }, 15000);
}

// Resolve project root reliably across dev and packaged modes (cached)
let _cachedProjectRoot = null;
function findProjectRoot() {
  if (_cachedProjectRoot) return _cachedProjectRoot;
  const candidates = [
    process.env.LABRYO_PROJECT_ROOT,
    process.cwd(),
    path.dirname(app.getPath('exe')),
    app.getAppPath(),
    path.join(__dirname, '..', '..'),
    'D:\\lab',
    'C:\\lab',
  ];

  for (const start of candidates) {
    if (!start) continue;
    let cur = start;
    for (let i = 0; i < 8; i++) {
      if (fs.existsSync(path.join(cur, 'package.json')) && fs.existsSync(path.join(cur, 'apps', 'web'))) {
        _cachedProjectRoot = cur;
        return cur;
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
  }
  _cachedProjectRoot = 'D:\\lab';
  return _cachedProjectRoot;
}

// Async seed database copy — runs in background, never blocks startup
async function seedDatabaseAsync(engineDir, userDbFile) {
  const seedCandidates = [
    path.join(engineDir, 'standalone', 'apps', 'web', 'data', 'lab_store.json'),
    path.join(engineDir, 'standalone', 'data', 'lab_store.json'),
    path.join(engineDir, 'data', 'lab_store.json'),
  ];
  for (const sc of seedCandidates) {
    try {
      await fs.promises.access(sc);
      const rawSeed = await fs.promises.readFile(sc, 'utf-8');
      const seedData = JSON.parse(rawSeed);
      seedData.patients = [];
      seedData.samples = [];
      seedData.expenses = [];
      seedData.doctors = [];
      seedData.incomingResults = [];
      seedData.deviceRawLogs = [];
      if (!seedData.settings) seedData.settings = {};
      seedData.settings.labName = '';
      seedData.settings.doctorName = '';
      seedData.settings.phone = '';
      seedData.settings.whatsappNumber = '';
      seedData.settings.address = '';
      seedData.settings.reportHeader = '';
      seedData.settings.isConfigured = false;
      delete seedData.license;
      await fs.promises.writeFile(userDbFile, JSON.stringify(seedData, null, 2), 'utf-8');
      console.log('[Desktop] Copied and sanitized seed database to:', userDbFile);
      return;
    } catch (e) {
      // Try next candidate
    }
  }
  console.warn('[Desktop] No seed database found in any candidate path');
}

// Synchronous seed SQLite database copy (first install only)
function seedSqliteDatabaseSync(engineDir, userSqliteDb) {
  const seedCandidates = [
    path.join(engineDir, 'standalone', 'apps', 'web', 'data', 'lab.db'),
    path.join(engineDir, 'standalone', 'data', 'lab.db'),
    path.join(engineDir, 'data', 'lab.db'),
    path.join(engineDir, 'lab.db'),
  ];
  for (const sc of seedCandidates) {
    try {
      if (fs.existsSync(sc)) {
        fs.copyFileSync(sc, userSqliteDb);
        console.log('[Desktop] Copied seed SQLite database to:', userSqliteDb);
        return;
      }
    } catch (e) {
      console.warn('[Desktop] Error copying seed sqlite db:', e?.message);
    }
  }
}

// Helper to ensure standalone directory has required static and public assets (R5)
function ensureStandaloneAssets(targetAppDir, webDir) {
  try {
    const targetNextDir = path.join(targetAppDir, '.next');
    if (!fs.existsSync(targetNextDir)) {
      fs.mkdirSync(targetNextDir, { recursive: true });
    }

    // Ensure .next/static is linked (junction) or copied
    const staticSrc = path.join(webDir, '.next', 'static');
    const staticDest = path.join(targetNextDir, 'static');
    if (fs.existsSync(staticSrc)) {
      let needsLink = true;
      try {
        const stat = fs.lstatSync(staticDest);
        if (stat) needsLink = false;
      } catch (e) {
        needsLink = true;
      }
      if (needsLink) {
        try {
          fs.symlinkSync(staticSrc, staticDest, 'junction');
          console.log('[Desktop] Linked .next/static junction into standalone engine');
        } catch (e) {
          try {
            fs.cpSync(staticSrc, staticDest, { recursive: true });
            console.log('[Desktop] Copied .next/static into standalone engine');
          } catch (cpErr) {}
        }
      }
    }

    // Ensure public assets are linked (junction) or copied
    const publicSrc = path.join(webDir, 'public');
    const publicDest = path.join(targetAppDir, 'public');
    if (fs.existsSync(publicSrc)) {
      let needsLink = true;
      try {
        const stat = fs.lstatSync(publicDest);
        if (stat) needsLink = false;
      } catch (e) {
        needsLink = true;
      }
      if (needsLink) {
        try {
          fs.symlinkSync(publicSrc, publicDest, 'junction');
          console.log('[Desktop] Linked public junction into standalone engine');
        } catch (e) {
          try {
            fs.cpSync(publicSrc, publicDest, { recursive: true });
            console.log('[Desktop] Copied public into standalone engine');
          } catch (cpErr) {}
        }
      }
    }
  } catch (err) {
    console.warn('[Desktop] Non-critical warning ensuring standalone assets:', err?.message);
  }
}

// Detect and prioritize the freshest standalone build (R5)
function findFreshestStandaloneServer(projectRoot) {
  const webDir = path.join(projectRoot, 'apps', 'web');
  const candidates = [
    {
      name: 'web_standalone_monorepo',
      script: path.join(projectRoot, 'apps', 'web', '.next', 'standalone', 'apps', 'web', 'server.js'),
      cwd: path.join(projectRoot, 'apps', 'web', '.next', 'standalone', 'apps', 'web'),
      appDir: path.join(projectRoot, 'apps', 'web', '.next', 'standalone', 'apps', 'web'),
      dataDir: path.join(projectRoot, 'apps', 'web', 'data'),
      priorityWeight: 100, // Highest priority: active Next.js build
    },
    {
      name: 'web_standalone_root',
      script: path.join(projectRoot, 'apps', 'web', '.next', 'standalone', 'server.js'),
      cwd: path.join(projectRoot, 'apps', 'web', '.next', 'standalone'),
      appDir: path.join(projectRoot, 'apps', 'web', '.next', 'standalone'),
      dataDir: path.join(projectRoot, 'apps', 'web', 'data'),
      priorityWeight: 90,
    },
    {
      name: 'desktop_engine_bundled',
      script: path.join(projectRoot, 'apps', 'desktop', 'engine', 'standalone', 'apps', 'web', 'server.js'),
      cwd: path.join(projectRoot, 'apps', 'desktop', 'engine', 'standalone', 'apps', 'web'),
      appDir: path.join(projectRoot, 'apps', 'desktop', 'engine', 'standalone', 'apps', 'web'),
      dataDir: path.join(projectRoot, 'apps', 'web', 'data'),
      priorityWeight: 10,
    },
    {
      name: 'desktop_engine_root',
      script: path.join(projectRoot, 'apps', 'desktop', 'engine', 'standalone', 'server.js'),
      cwd: path.join(projectRoot, 'apps', 'desktop', 'engine', 'standalone'),
      appDir: path.join(projectRoot, 'apps', 'desktop', 'engine', 'standalone'),
      dataDir: path.join(projectRoot, 'apps', 'web', 'data'),
      priorityWeight: 5,
    },
  ];

  const valid = [];
  for (const c of candidates) {
    if (fs.existsSync(c.script)) {
      try {
        const stat = fs.statSync(c.script);
        valid.push({ ...c, mtimeMs: stat.mtimeMs });
      } catch (e) {}
    }
  }

  if (valid.length === 0) return null;

  // Sort by modification time (freshest first)
  // If timestamps are within 2 seconds of each other, prioritize active web_standalone
  valid.sort((a, b) => {
    const timeDiff = b.mtimeMs - a.mtimeMs;
    if (Math.abs(timeDiff) > 2000) {
      return timeDiff;
    }
    return b.priorityWeight - a.priorityWeight;
  });

  const selected = valid[0];
  console.log(`[Desktop] Prioritizing standalone engine: ${selected.name} (${selected.script}) [Modified: ${new Date(selected.mtimeMs).toISOString()}]`);

  // Ensure assets are linked/copied
  ensureStandaloneAssets(selected.appDir, webDir);

  return selected;
}

// Find Next.js CLI binary or bundled standalone server to spawn Node directly
function getStartCommand(projectRoot) {
  // 1. Packaged standalone production mode (for installer & client PCs)
  if (app.isPackaged) {
    const engineDir = path.join(process.resourcesPath, 'engine');
    const nodeBin = path.join(engineDir, 'node.exe');

    let serverScript = path.join(engineDir, 'standalone', 'apps', 'web', 'server.js');
    let workingDir = path.join(engineDir, 'standalone', 'apps', 'web');
    if (!fs.existsSync(serverScript)) {
      serverScript = path.join(engineDir, 'standalone', 'server.js');
      workingDir = path.join(engineDir, 'standalone');
    }

    const userDataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    // Seed initial SQLite database (non-destructive, first install only)
    const userSqliteDb = path.join(userDataDir, 'lab.db');
    if (!fs.existsSync(userSqliteDb)) {
      seedSqliteDatabaseSync(engineDir, userSqliteDb);
    }

    // Seed initial JSON database asynchronously in background (non-blocking fallback)
    const userDbFile = path.join(userDataDir, 'lab_store.json');
    if (!fs.existsSync(userDbFile)) {
      seedDatabaseAsync(engineDir, userDbFile);
    }

    const normalizedDbUrl = 'file:' + userSqliteDb.replace(/\\/g, '/') + '?connection_limit=1&socket_timeout=10000&busy_timeout=5000';

    return {
      cmd: fs.existsSync(nodeBin) ? nodeBin : 'node',
      args: [serverScript],
      cwd: workingDir,
      extraEnv: {
        LABRYO_DATA_DIR: userDataDir,
        DATABASE_URL: normalizedDbUrl,
        HOSTNAME: '0.0.0.0',
        PORT: String(WEB_PORT),
        NODE_ENV: 'production',
      },
    };
  }

  // 2. Development / local monorepo mode
  const isDevMode = process.env.LABRYO_DEV === '1' || process.argv.includes('--dev');
  if (isDevMode) {
    console.log('[Desktop] Live Development Mode enabled (Next.js Fast Refresh HMR active)');
    const isWin = process.platform === 'win32';
    return {
      cmd: isWin ? 'npm.cmd' : 'npm',
      args: ['run', 'dev:web'],
      cwd: projectRoot,
      extraEnv: {
        PORT: String(WEB_PORT),
        NODE_ENV: 'development',
      },
    };
  }

  let nodeCmd = 'node';
  const nodeCandidates = [
    path.join(projectRoot, 'apps', 'desktop', 'engine', 'node.exe'),
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
  ];
  for (const nc of nodeCandidates) {
    if (fs.existsSync(nc)) {
      nodeCmd = nc;
      break;
    }
  }

  // Check for ultra-fast standalone server (freshest build prioritized)
  const standalone = findFreshestStandaloneServer(projectRoot);
  if (standalone) {
    return {
      cmd: nodeCmd,
      args: [standalone.script],
      cwd: standalone.cwd,
      extraEnv: {
        LABRYO_DATA_DIR: standalone.dataDir,
        HOSTNAME: '0.0.0.0',
        PORT: String(WEB_PORT),
        NODE_ENV: 'production',
      },
    };
  }

  const nextBinCandidates = [
    path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(projectRoot, 'apps', 'web', 'node_modules', 'next', 'dist', 'bin', 'next'),
  ];

  for (const bin of nextBinCandidates) {
    if (fs.existsSync(bin)) {
      return {
        cmd: nodeCmd,
        args: [bin, 'start', '-H', '0.0.0.0', '-p', String(WEB_PORT)],
        cwd: path.join(projectRoot, 'apps', 'web'),
      };
    }
  }

  // Fallback to npm if direct binary not found
  const isWin = process.platform === 'win32';
  return {
    cmd: isWin ? 'npm.cmd' : 'npm',
    args: ['run', 'start:web'],
    cwd: projectRoot,
  };
}

// Ultra-fast TCP port check (responds in 0.5-2ms on localhost without overhead)
function checkTcpPort(port, host = '127.0.0.1', timeoutMs = 40) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on('error', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.connect(port, host);
  });
}

// Fast HTTP Health Check once port is open (responds in 5-20ms normally, permits up to 1500ms on cold compilation)
function checkHttpHealth(port, timeoutMs = 1500) {
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

// Check if web server is responsive with ultra-fast 2-stage validation
async function isServerReady(port) {
  const portOpen = await checkTcpPort(port, '127.0.0.1', 40);
  if (!portOpen) return false;
  return await checkHttpHealth(port, 1500);
}

// No-op or non-competing pre-warm to avoid double-request SSR stalls
function preWarmServer(port) {
  // Directly loaded by mainWindow.loadURL to avoid double-render CPU competition
}

// Kill backend process cleanly with atomic idempotency and non-blocking port liberation (<15ms)
function killBackendProcess(options = {}) {
  const isForRestart = options.forRestart === true;
  if (!isForRestart) {
    if (isShuttingDown) return;
    isShuttingDown = true;
  }

  if (backendProcess && backendProcess.pid) {
    const pid = backendProcess.pid;
    backendProcess = null;
    try {
      if (process.platform === 'win32') {
        // Fast synchronous native taskkill (<15ms)
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
      } else {
        try {
          process.kill(pid, 'SIGKILL');
        } catch (e) {}
      }
    } catch (e) {}
  }

  // Completely non-blocking asynchronous fallback to liberate port without freezing Electron UI
  if (process.platform === 'win32') {
    try {
      const fallbackProc = spawn('powershell', [
        '-NoProfile',
        '-WindowStyle', 'Hidden',
        '-Command',
        `Get-NetTCPConnection -LocalPort ${WEB_PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`
      ], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      fallbackProc.unref();
    } catch (e) {}
  }
}

// Start local production server if not already running
async function ensureServerStarted() {
  const ready = await isServerReady(WEB_PORT);
  if (ready) {
    console.log('[Desktop] Web server is already running on port', WEB_PORT);
    return true;
  }

  console.log('[Desktop] Starting background web server...');
  const projectRoot = findProjectRoot();
  console.log('[Desktop] Resolved project root:', projectRoot);

  const startConfig = getStartCommand(projectRoot);
  console.log('[Desktop] Spawning server:', startConfig.cmd, startConfig.args.join(' '));

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(WEB_PORT),
    ...(startConfig.extraEnv || {}),
  };

  backendProcess = spawn(startConfig.cmd, startConfig.args, {
    cwd: startConfig.cwd,
    shell: startConfig.cmd.endsWith('.cmd') || startConfig.cmd.endsWith('.bat'),
    stdio: 'ignore',
    windowsHide: true,
    detached: false,
    env,
  });

  backendProcess.on('error', (err) => {
    console.error('[Desktop] Failed to spawn web server:', err);
  });

  return false;
}

// Update splash status text dynamically
function updateSplashStatus(text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    const script = `
      var el = document.getElementById('status-text');
      if (el) { el.innerText = ${JSON.stringify(text)}; }
    `;
    splashWindow.webContents.executeJavaScript(script).catch(() => {});
  }
}

// Embedded instant splash screen HTML (renders in 30ms)
function getSplashHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Labryo LIMS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
      user-select: none;
      -webkit-app-region: drag;
    }
    .card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 30px;
      border: 1px solid rgba(6, 182, 212, 0.25);
      background: radial-gradient(circle at center top, rgba(15, 23, 42, 0.95), #090d16);
      box-shadow: inset 0 0 30px rgba(6, 182, 212, 0.05);
    }
    .icon-box {
      width: 68px;
      height: 68px;
      margin-bottom: 18px;
      background: rgba(6, 182, 212, 0.12);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(6, 182, 212, 0.4);
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
      animation: pulse-glow 2.5s infinite ease-in-out;
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.2); transform: scale(1); }
      50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.45); transform: scale(1.03); }
    }
    .title {
      font-size: 21px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: 0.3px;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .progress-track {
      width: 280px;
      height: 5px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      margin-bottom: 15px;
    }
    .progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 40%;
      background: linear-gradient(90deg, #06b6d4, #10b981);
      border-radius: 6px;
      animation: indeterminate 1.4s infinite ease-in-out;
    }
    @keyframes indeterminate {
      0% { left: -40%; width: 40%; }
      50% { left: 30%; width: 50%; }
      100% { left: 100%; width: 40%; }
    }
    .status {
      font-size: 12.5px;
      color: #38bdf8;
      font-weight: 600;
      transition: all 0.2s ease;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    </div>
    <div class="title">نظام لابريو الطبي (Labryo LIMS)</div>
    <div class="subtitle">نظام إدارة المختبرات الطبية والتشخيص الذكي المتقدم</div>
    <div class="progress-track">
      <div class="progress-bar"></div>
    </div>
    <div class="status" id="status-text">جاري إقلاع محرك النظام المحلي...</div>
  </div>
</body>
</html>`;
}

// Embedded error and auto-reconnect screen HTML
function getErrorHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Labryo LIMS - جاري الاتصال بالخادم</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      overflow: hidden;
      user-select: none;
    }
    .box {
      text-align: center;
      max-width: 480px;
      padding: 36px 30px;
      background: rgba(15, 23, 42, 0.9);
      border-radius: 20px;
      border: 1px solid rgba(244, 63, 94, 0.3);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .icon-box {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      background: rgba(244, 63, 94, 0.12);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    h2 {
      font-size: 20px;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 10px;
    }
    p {
      font-size: 13.5px;
      color: #94a3b8;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    button {
      background: #06b6d4;
      color: #090d16;
      font-weight: 700;
      border: none;
      padding: 12px 30px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    button:hover {
      background: #22d3ee;
      transform: translateY(-1px);
    }
    .auto-retry-notice {
      margin-top: 20px;
      font-size: 12px;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .dot-pulse {
      width: 8px;
      height: 8px;
      background-color: #38bdf8;
      border-radius: 50%;
      animation: pulse 1.2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon-box">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h2>تأخر استجابة المحرك المحلي</h2>
    <p>استغرق إقلاع محرك النظام وقتاً أطول من المعتاد. يقوم النظام حالياً بالفحص وإعادة الاتصال التلقائي في الخلفية...</p>
    <div class="btn-group">
      <button id="retry-btn" onclick="doManualRetry()">إعادة المحاولة الآن</button>
    </div>
    <div class="auto-retry-notice">
      <span class="dot-pulse"></span>
      <span id="auto-text">جاري التحقق التلقائي من جاهزية المحرك...</span>
    </div>
  </div>

  <script>
    function doManualRetry() {
      const btn = document.getElementById('retry-btn');
      btn.innerText = 'جاري الاتصال...';
      btn.disabled = true;
      window.location.href = 'http://localhost:${WEB_PORT}';
    }

    // Auto-poll in background and automatically enter when ready
    let autoTimer = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:${WEB_PORT}/health', { cache: 'no-store' });
        if (res.ok) {
          clearInterval(autoTimer);
          window.location.href = 'http://localhost:${WEB_PORT}';
        }
      } catch (e) {}
    }, 1200);
  </script>
</body>
</html>`;
}

// Main sequence to poll server and seamlessly transition from splash to main window
async function startAndLoadApp() {
  const appUrl = `http://localhost:${WEB_PORT}`;

  tracer.mark('Server Startup Sequence Triggered (T2)');
  updateSplashStatus('جاري إقلاع محرك النظام المحلي...');
  await ensureServerStarted();

  let ready = false;
  let attempts = 0;
  const maxAttempts = 100; // 25-second polling budget (100 attempts at 250ms)
  const pollIntervalMs = 250;

  while (attempts < maxAttempts) {
    ready = await isServerReady(WEB_PORT);
    if (ready) {
      tracer.mark(`Server Ready Detected on attempt #${attempts} (T3)`);
      break;
    }

    if (attempts === 0) {
      updateSplashStatus('جاري إقلاع محرك النظام المحلي...');
    } else if (attempts === 12) { // ~3 seconds
      updateSplashStatus('جاري فحص وتأمين قاعدة البيانات...');
    } else if (attempts === 36) { // ~9 seconds
      updateSplashStatus('جاري تحميل واجهات التحاليل...');
    } else if (attempts === 68) { // ~17 seconds
      updateSplashStatus('جاري استكمال إعدادات النظام وتجهيز الواجهة...');
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
    attempts++;
  }

  if (ready) {
    updateSplashStatus('اكتمل التجهيز — جاري فتح واجهة النظام...');

    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
    }

    tracer.mark('Navigating Main Window to App URL (T4)');
    // Load URL directly in background using pre-warmed renderer process
    mainWindow.loadURL(appUrl);

    // Show seamlessly once DOM is ready or first paint finishes (whichever is faster)
    let windowShown = false;
    const revealMainWindow = () => {
      if (windowShown) return;
      windowShown = true;
      isPreWarmed = true;
      tracer.mark('Revealing Main Window (TTI - T5)');
      tracer.summary();
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.maximize();
        mainWindow.focus();
      }
    };

    mainWindow.once('ready-to-show', revealMainWindow);
    mainWindow.webContents.once('dom-ready', () => {
      tracer.mark('DOM Content Ready (T4.5)');
      // DOM is parsed and stylesheets loaded: reveal immediately with 20ms buffer
      setTimeout(revealMainWindow, 20);
    });

    // Safety fallback: if neither fires within 1.6s, force show
    setTimeout(revealMainWindow, 1600);

  } else {
    // Server failed to start within timeout
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
    }
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getErrorHtml()));
    mainWindow.show();
  }
}

// Show or restore main window instantly (0.01s instant response)
function showMainWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
    splashWindow = null;
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
    startAndLoadApp();
    return;
  }

  if (!isPreWarmed && !mainWindow.webContents.getURL()) {
    createSplashWindow();
    startAndLoadApp();
    return;
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.maximize();
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
}

// Safe icon resolution functions for production packaging & system tray
function getTrayIcon() {
  const candidates = [
    path.join(__dirname, 'assets', 'tray-icon.png'),
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(process.resourcesPath || '', 'assets', 'tray-icon.png'),
    path.join(process.resourcesPath || '', 'assets', 'icon.png'),
    path.join(findProjectRoot(), 'apps', 'desktop', 'assets', 'tray-icon.png'),
    path.join(findProjectRoot(), 'apps', 'desktop', 'assets', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) {
        return img.resize({ width: 16, height: 16 });
      }
    }
  }
  return nativeImage.createEmpty();
}

function getWindowIcon() {
  const candidates = [
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(process.resourcesPath || '', 'assets', 'icon.png'),
    path.join(findProjectRoot(), 'apps', 'desktop', 'assets', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

// Windows silent auto-launch configuration
function configureAutoLaunch(enable = true) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,
      path: process.execPath,
      args: ['--hidden'],
    });
    console.log(`[Desktop] Auto-launch configured: openAtLogin=${enable}, openAsHidden=true`);
  } catch (err) {
    console.error('[Desktop] Failed to configure auto-launch:', err);
  }
}

// Initialize system tray with Arabic controls
function createTray() {
  if (tray) return;

  try {
    const icon = getTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip('Labryo LIMS - نظام إدارة المختبرات الطبية والتشخيص الذكي');

    const updateContextMenu = () => {
      let autoLaunch = false;
      try {
        autoLaunch = app.getLoginItemSettings().openAtLogin;
      } catch (e) {}

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'نظام لابريو الطبي (قيد العمل في الخلفية)',
          enabled: false,
        },
        { type: 'separator' },
        {
          label: '⚡ فتح واجهة النظام (إظهار فوري)',
          click: () => showMainWindow(),
        },
        {
          label: '🌐 فتح في المتصفح (للأجهزة المتصلة بالشبكة)',
          click: () => shell.openExternal(`http://localhost:${WEB_PORT}`),
        },
        { type: 'separator' },
        {
          label: '🚀 التشغيل التلقائي مع بدء الويندوز',
          type: 'checkbox',
          checked: autoLaunch,
          click: (menuItem) => {
            configureAutoLaunch(menuItem.checked);
          },
        },
        {
          label: '🔄 إعادة تشغيل محرك النظام',
          click: async () => {
            killBackendProcess({ forRestart: true });
            await ensureServerStarted();
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.loadURL(`http://localhost:${WEB_PORT}`);
            }
          },
        },
        {
          label: '☁️ التحقق من وجود تحديثات...',
          click: () => {
            if (autoUpdater && app.isPackaged) {
              autoUpdater.checkForUpdates().then((res) => {
                if (!res || !res.downloadPromise) {
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'تحديث النظام',
                    message: 'نظامك محدث إلى آخر إصدار رسمي!',
                    buttons: ['حسناً'],
                  });
                }
              }).catch(() => {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'تحديث النظام',
                  message: 'تعذر الاتصال بخادم التحديثات حالياً. يرجى التحقق من اتصال الإنترنت.',
                  buttons: ['حسناً'],
                });
              });
            } else {
              dialog.showMessageBox({
                type: 'info',
                title: 'تحديث النظام',
                message: 'البرنامج يعمل حالياً بنمط التطوير المحلي (Dev Mode). التحديث التلقائي يعمل في النسخة المثبتة الرسمية.',
                buttons: ['حسناً'],
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: '❌ خروج نهائي وإيقاف الخدمات (Exit)',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.hide();
            }
            if (splashWindow && !splashWindow.isDestroyed()) {
              splashWindow.destroy();
              splashWindow = null;
            }
            isQuitting = true;
            killBackendProcess();
            app.quit();
          },
        },
      ]);

      tray.setContextMenu(contextMenu);
    };

    updateContextMenu();

    tray.on('click', () => {
      showMainWindow();
    });

    tray.on('double-click', () => {
      showMainWindow();
    });
  } catch (err) {
    console.error('[Desktop] Failed to create system tray:', err);
  }
}

// Create native frameless instant splash screen window
function createSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) return;

  const projectRoot = findProjectRoot();
  const winIconPath = path.join(projectRoot, 'apps', 'desktop', 'assets', 'icon.png');
  const winIcon = fs.existsSync(winIconPath) ? winIconPath : undefined;

  splashWindow = new BrowserWindow({
    width: 480,
    height: 310,
    resizable: false,
    frame: false,
    center: true,
    show: true,
    alwaysOnTop: true,
    backgroundColor: '#090d16',
    icon: winIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getSplashHtml()));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Lightweight dark warmup shell to pre-initialize Chromium renderer & V8 JIT engine
function getWarmupHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>body { background: #090d16; margin: 0; overflow: hidden; }</style>
</head>
<body></body>
</html>`;
}

// Create silent main window (initially hidden until content is ready)
function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return;

  const winIcon = getWindowIcon();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Labryo (لابريو) - نظام إدارة المختبرات الطبية والتشخيص الذكي',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
    paintWhenInitiallyHidden: true,
    icon: winIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  // Pre-warm the Chromium renderer process in memory while Node server boots
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getWarmupHtml()));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Live Dev Mode Keyboard Shortcuts (F5 to force refresh, F12 to inspect DevTools)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow.reload();
      } else if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
      }
    }
  });

  // Clean instant exit: hide window in first tick (<50ms) and terminate all services
  mainWindow.on('close', () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }
    } catch (err) {}

    isQuitting = true;
    killBackendProcess();
    app.quit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
    mainWindow.close();
  }
});

ipcMain.on('app-exit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
    splashWindow = null;
  }
  isQuitting = true;
  killBackendProcess();
  app.quit();
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('print-document', async (event, { url, printOptions }) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  try {
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    await printWin.loadURL(url);
    
    return new Promise((resolve) => {
      printWin.webContents.print(
        {
          silent: printOptions?.silent || false,
          printBackground: true,
          deviceName: printOptions?.deviceName || '',
        },
        (success, failureReason) => {
          printWin.close();
          resolve({ success, failureReason });
        }
      );
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Background pre-warming for hidden launch without network race conditions
async function startBackgroundPreWarm() {
  const appUrl = `http://localhost:${WEB_PORT}`;
  isStartingUp = true;

  try {
    await ensureServerStarted();

    let ready = false;
    let attempts = 0;
    const maxAttempts = 100; // 25-second polling budget (100 attempts at 250ms)
    const pollIntervalMs = 250;

    while (attempts < maxAttempts) {
      ready = await isServerReady(WEB_PORT);
      if (ready) break;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      attempts++;
    }

    if (ready && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(appUrl);

      mainWindow.once('ready-to-show', () => {
        isPreWarmed = true;
        isStartingUp = false;
        console.log('[Desktop] Background pre-warming complete. Warm start ready in <50ms.');
      });
    } else {
      isStartingUp = false;
    }
  } catch (err) {
    console.error('[Desktop] Background pre-warming error:', err);
    isStartingUp = false;
  }
}

// App Lifecycle
app.whenReady().then(() => {
  tracer.mark('Electron Ready (T1)');

  // Disable automatic background launch with Windows boot
  configureAutoLaunch(false);

  // Normal user launch: show instant splash and load cleanly
  createSplashWindow();
  tracer.mark('Splash Window Created');

  createMainWindow();
  tracer.mark('Main Window Pre-Created & Warmed');

  startAndLoadApp();
  initAutoUpdater();

  app.on('activate', () => {
    showMainWindow();
  });
});

app.on('second-instance', () => {
  showMainWindow();
});

app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try { mainWindow.hide(); } catch (e) {}
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    try { splashWindow.destroy(); splashWindow = null; } catch (e) {}
  }
  isQuitting = true;
  killBackendProcess();
});

app.on('window-all-closed', () => {
  isQuitting = true;
  killBackendProcess();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
