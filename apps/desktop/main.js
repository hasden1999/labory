const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const http = require('http');

// Enforce single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let backendProcess = null;
const WEB_PORT = 8080;

// Resolve project root reliably across dev and packaged modes
function findProjectRoot() {
  const candidates = [
    process.cwd(),
    path.dirname(app.getPath('exe')),
    app.getAppPath(),
    path.join(__dirname, '..', '..'),
    'D:\\lab',
  ];

  for (const start of candidates) {
    if (!start) continue;
    let cur = start;
    for (let i = 0; i < 6; i++) {
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

// Check if web server is responsive
function isServerReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.abort();
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

  backendProcess = spawn('npm.cmd', ['run', 'start:web'], {
    cwd: projectRoot,
    shell: true,
    stdio: 'ignore',
    windowsHide: true,
    detached: false,
  });

  return false;
}

// Embedded loading screen HTML for immediate visual response
function getLoadingHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>نظام مختبر الرضا الطبي</title>
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
      background: rgba(15, 23, 42, 0.75);
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
    <div class="subtitle">النسخة المكتبية عالية الأداء — تشغيل فوري أوفلاين</div>
    <div class="progress-bar"></div>
    <div class="status" id="status-text">جاري فحص وتشغيل الخدمات المحلية...</div>
  </div>
</body>
</html>`;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Labryo (لابريو) - نظام إدارة المختبرات الطبية والتشخيص الذكي',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
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
  const appUrl = `http://localhost:${WEB_PORT}`;

  (async () => {
    await ensureServerStarted();

    let ready = false;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 400ms = 16 seconds

    while (attempts < maxAttempts) {
      ready = await isServerReady(WEB_PORT);
      if (ready) break;
      await new Promise((r) => setTimeout(r, 400));
      attempts++;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      if (ready) {
        mainWindow.loadURL(appUrl);
      } else {
        // Show retry screen
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <style>
              body { background: #090d16; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .box { text-align: center; max-width: 460px; padding: 30px; background: #0f172a; border-radius: 16px; border: 1px solid #334155; }
              h2 { color: #f43f5e; margin-bottom: 12px; }
              p { font-size: 13.5px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
              button { background: #06b6d4; color: #090d16; font-weight: bold; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2>تعذر الاتصال بالخادم المحلي</h2>
              <p>تأخر تشغيل محرك النظام على المنفذ 8080. يرجى الضغط على زر إعادة المحاولة.</p>
              <button onclick="window.location.reload()">إعادة المحاولة</button>
            </div>
          </body>
          </html>
        `));
      }
    }
  })();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
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
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('before-quit', killBackendProcess);
app.on('window-all-closed', () => {
  killBackendProcess();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
