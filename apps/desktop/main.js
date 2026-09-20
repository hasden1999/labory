const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');

// Disable hardware acceleration to eliminate Windows GPU crashes & black screen glitches
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
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

// Resolve project root reliably across dev and packaged modes
function findProjectRoot() {
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
        return cur;
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
  }
  return 'D:\\lab';
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

    // Seed initial database if not yet existing on client's machine
    const userDbFile = path.join(userDataDir, 'lab_store.json');
    if (!fs.existsSync(userDbFile)) {
      const seedCandidates = [
        path.join(engineDir, 'standalone', 'apps', 'web', 'data', 'lab_store.json'),
        path.join(engineDir, 'standalone', 'data', 'lab_store.json'),
        path.join(engineDir, 'data', 'lab_store.json'),
      ];
      for (const sc of seedCandidates) {
        if (fs.existsSync(sc)) {
          try {
            const rawSeed = fs.readFileSync(sc, 'utf-8');
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

            fs.writeFileSync(userDbFile, JSON.stringify(seedData, null, 2), 'utf-8');
            console.log('[Desktop] Copied and sanitized seed database to:', userDbFile);
            break;
          } catch (e) {
            console.error('[Desktop] Failed to copy seed DB:', e);
          }
        }
      }
    }

    return {
      cmd: fs.existsSync(nodeBin) ? nodeBin : 'node',
      args: [serverScript],
      cwd: workingDir,
      extraEnv: {
        LABRYO_DATA_DIR: userDataDir,
        HOSTNAME: '0.0.0.0',
        PORT: String(WEB_PORT),
        NODE_ENV: 'production',
      },
    };
  }

  // 2. Development / local monorepo mode
  const nextBinCandidates = [
    path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(projectRoot, 'apps', 'web', 'node_modules', 'next', 'dist', 'bin', 'next'),
  ];

  let nodeCmd = 'node';
  const nodeCandidates = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
  ];
  for (const nc of nodeCandidates) {
    if (fs.existsSync(nc)) {
      nodeCmd = nc;
      break;
    }
  }

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

// Ultra-fast TCP port check (responds in 1-5ms without HTTP handshake overhead)
function checkTcpPort(port, host = '127.0.0.1', timeoutMs = 250) {
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

// Fast HTTP Health Check once port is open
function checkHttpHealth(port, timeoutMs = 1200) {
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

// Check if web server is responsive with 2-stage fast validation
async function isServerReady(port) {
  const portOpen = await checkTcpPort(port, '127.0.0.1', 200);
  if (!portOpen) return false;
  return await checkHttpHealth(port, 1000);
}

// Silent background route pre-warming to compile React RSC chunks before display
function preWarmServer(port) {
  try {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      res.resume(); // Discard stream to release memory
    });
    req.on('error', () => {});
    req.setTimeout(3000, () => {
      try { req.abort(); } catch (e) {}
    });
  } catch (e) {}
}

// Kill backend process and all its tree cleanly, ensuring port is liberated
function killBackendProcess() {
  if (backendProcess && backendProcess.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        backendProcess.kill();
      }
    } catch (e) {}
    backendProcess = null;
  }
  if (process.platform === 'win32') {
    try {
      execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${WEB_PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
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
    <div class="status" id="status-text">جاري بدء تشغيل محرك النظام وقاعدة البيانات...</div>
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

  updateSplashStatus('جاري فحص حالة الخادم المحلي...');
  await ensureServerStarted();

  let ready = false;
  let attempts = 0;
  const maxAttempts = 180; // 180 attempts with dynamic fast polling (50ms initial)

  while (attempts < maxAttempts) {
    ready = await isServerReady(WEB_PORT);
    if (ready) break;

    if (attempts === 4) {
      updateSplashStatus('جاري تشغيل محرك النظام وقاعدة البيانات المحلية...');
    } else if (attempts === 20) {
      updateSplashStatus('جاري تهيئة خدمات الفحوصات والتحاليل الطبية...');
    } else if (attempts === 50) {
      updateSplashStatus('جاري استكمال إقلاع النظام، ثوانٍ معدودة...');
    }

    const interval = attempts < 40 ? 50 : 100;
    await new Promise((r) => setTimeout(r, interval));
    attempts++;
  }

  if (ready) {
    updateSplashStatus('اكتمل التجهيز — جاري فتح واجهة النظام...');
    preWarmServer(WEB_PORT);

    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
    }

    // Load URL silently in background
    mainWindow.loadURL(appUrl);

    // Show seamlessly once first paint / ready
    mainWindow.once('ready-to-show', () => {
      isPreWarmed = true;
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.maximize();
        mainWindow.focus();
      }
    });

    // Safety fallback: if ready-to-show takes more than 3.5s, force show
    setTimeout(() => {
      isPreWarmed = true;
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.maximize();
        mainWindow.focus();
      }
    }, 3500);

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
            killBackendProcess();
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
    show: false,
    alwaysOnTop: true,
    backgroundColor: '#090d16',
    icon: winIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getSplashHtml()));

  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
    }
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Clean exit: closing main window terminates all services and exits completely
  mainWindow.on('close', () => {
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
  if (mainWindow) mainWindow.close();
});

ipcMain.on('app-exit', () => {
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
    const maxAttempts = 180; // Fast dynamic 50ms polling

    while (attempts < maxAttempts) {
      ready = await isServerReady(WEB_PORT);
      if (ready) break;
      const interval = attempts < 40 ? 50 : 100;
      await new Promise((r) => setTimeout(r, interval));
      attempts++;
    }

    if (ready && mainWindow && !mainWindow.isDestroyed()) {
      preWarmServer(WEB_PORT);
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
  // Disable automatic background launch with Windows boot
  configureAutoLaunch(false);

  // Normal user launch: show instant splash and load cleanly
  createSplashWindow();
  createMainWindow();
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
