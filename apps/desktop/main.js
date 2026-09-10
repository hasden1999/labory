const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const http = require('http');

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
let backendProcess = null;
let tray = null;
let isQuitting = false;
let hasShownTrayNotice = false;
const WEB_PORT = 8080;

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

// Find Next.js CLI binary to spawn Node directly (starts in 2s vs 20s via npm wrappers)
function getStartCommand(projectRoot) {
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

// Check if web server is responsive
function isServerReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2500, () => {
      try { req.abort(); } catch (e) {}
      resolve(false);
    });
  });
}

// Kill backend process and all its tree cleanly
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

  backendProcess = spawn(startConfig.cmd, startConfig.args, {
    cwd: startConfig.cwd,
    shell: startConfig.cmd.endsWith('.cmd') || startConfig.cmd.endsWith('.bat'),
    stdio: 'ignore',
    windowsHide: true,
    detached: false,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(WEB_PORT) },
  });

  backendProcess.on('error', (err) => {
    console.error('[Desktop] Failed to spawn web server:', err);
  });

  return false;
}

// Update loading screen text dynamically
function updateLoadingStatus(targetWindow, text) {
  if (targetWindow && !targetWindow.isDestroyed()) {
    const script = `
      var el = document.getElementById('status-text');
      if (el) { el.innerText = ${JSON.stringify(text)}; }
    `;
    targetWindow.webContents.executeJavaScript(script).catch(() => {});
  }
}

// Embedded loading screen HTML for immediate visual response
function getLoadingHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>نظام إدارة المختبرات الطبية والتشخيص الذكي - Labryo LIMS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
      user-select: none;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 36px 30px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .icon-box {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      background: rgba(6, 182, 212, 0.12);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .progress-bar {
      width: 100%;
      height: 6px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      margin-bottom: 16px;
    }
    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 40%;
      background: linear-gradient(90deg, #06b6d4, #10b981);
      border-radius: 6px;
      animation: indeterminate 1.5s infinite ease-in-out;
    }
    @keyframes indeterminate {
      0% { left: -40%; width: 40%; }
      50% { left: 30%; width: 50%; }
      100% { left: 100%; width: 40%; }
    }
    .status {
      font-size: 12.5px;
      color: #06b6d4;
      font-weight: 600;
      transition: all 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-box">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    </div>
    <div class="title">نظام لابريو الطبي (Labryo LIMS)</div>
    <div class="subtitle">النسخة المكتبية الرسمية — تشغيل فوري وآمن</div>
    <div class="progress-bar"></div>
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

// Main sequence to poll server and load main UI
async function startAndLoadApp(targetWindow) {
  const appUrl = `http://localhost:${WEB_PORT}`;

  await ensureServerStarted();

  let ready = false;
  let attempts = 0;
  const maxAttempts = 180; // 180 * 200ms = 36 seconds buffer

  while (attempts < maxAttempts) {
    ready = await isServerReady(WEB_PORT);
    if (ready) break;

    if (attempts === 5) {
      updateLoadingStatus(targetWindow, 'جاري تشغيل محرك النظام وقاعدة البيانات المحلية...');
    } else if (attempts === 20) {
      updateLoadingStatus(targetWindow, 'جاري تهيئة خدمات المختبر والتحقق من الجاهزية...');
    } else if (attempts === 45) {
      updateLoadingStatus(targetWindow, 'جاري إتمام إقلاع النظام، يرجى الانتظار ثوانٍ معدودة...');
    }

    await new Promise((r) => setTimeout(r, 200));
    attempts++;
  }

  if (targetWindow && !targetWindow.isDestroyed()) {
    if (ready) {
      targetWindow.loadURL(appUrl);
    } else {
      targetWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getErrorHtml()));
    }
  }
}

// Resolve tray icon reliably
function getTrayIcon() {
  const projectRoot = findProjectRoot();
  const candidates = [
    path.join(__dirname, 'assets', 'tray-icon.png'),
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(projectRoot, 'apps', 'desktop', 'assets', 'tray-icon.png'),
    path.join(projectRoot, 'apps', 'desktop', 'assets', 'icon.png'),
    path.join(projectRoot, 'apps', 'web', 'public', 'logo.png'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) {
          return img.resize({ width: 16, height: 16 });
        }
      } catch (e) {}
    }
  }
  return nativeImage.createEmpty();
}

// Show or restore main window instantly (0.01s)
function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
    return;
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
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
            try {
              app.setLoginItemSettings({
                openAtLogin: menuItem.checked,
                openAsHidden: true,
              });
            } catch (err) {
              console.error('[Desktop] Failed to update login settings:', err);
            }
          },
        },
        {
          label: '🔄 إعادة تشغيل محرك النظام',
          click: async () => {
            killBackendProcess();
            await ensureServerStarted();
            if (mainWindow && !mainWindow.isDestroyed()) {
              startAndLoadApp(mainWindow);
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

function createMainWindow() {
  const projectRoot = findProjectRoot();
  const winIconPath = path.join(projectRoot, 'apps', 'desktop', 'assets', 'icon.png');
  const winIcon = fs.existsSync(winIconPath) ? winIconPath : undefined;

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Labryo (لابريو) - نظام إدارة المختبرات الطبية والتشخيص الذكي',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
    icon: winIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // 1. Immediately show window with loading screen
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getLoadingHtml()));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // 2. Start server and poll until ready, then load app
  startAndLoadApp(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Intercept window close: hide to system tray instead of exiting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      if (!hasShownTrayNotice && tray) {
        try {
          tray.displayBalloon({
            title: 'نظام لابريو الطبي (Labryo LIMS)',
            content: 'النظام مستمر في العمل في الخلفية لخدمة الأجهزة والمحطات المتصلة. انقر على أيقونة البرنامج لفتحه فوراً.',
          });
          hasShownTrayNotice = true;
        } catch (e) {}
      }
    }
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

// App Lifecycle
app.whenReady().then(() => {
  createTray();
  createMainWindow();

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
  if (isQuitting) {
    killBackendProcess();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
