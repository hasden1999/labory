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

// Ensure Node 18+ platform check is always bypassed on Windows 7 / 8 / 8.1
process.env.NODE_SKIP_PLATFORM_CHECK = '1';

const { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const os = require('os');

// Hardware Acceleration & Safe Rendering Mode for Windows 7 / 8 / 8.1 & 32-bit GPUs
const isLegacyWindows =
  process.platform === 'win32' &&
  (os.release().startsWith('6.1') || os.release().startsWith('6.2') || os.release().startsWith('6.3'));
const is32BitArch = process.arch === 'ia32';
const isSafeMode =
  process.argv.includes('--safe-mode') ||
  process.env.LABRYO_SAFE_MODE === '1' ||
  isLegacyWindows ||
  is32BitArch;

if (isSafeMode) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  // NOTE: Never append 'disable-software-rasterizer'. When GPU is disabled, Chromium requires SwiftShader for CPU rasterization.
} else {
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
}
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

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
let isShuttingDown = false;
let isPreWarmed = false;
let isStartingUp = false;
let recoveryInterval = null;
let WEB_PORT = 8080;
const FALLBACK_PORTS = [8080, 8085, 8088, 8090, 8180, 3080, 3880];

const updateService = require('./services/updateService');
let deviceBridgeService = null;
try {
  deviceBridgeService = require('./services/deviceBridgeService');
} catch (e) {}

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

// Synchronous seed JSON database copy — ensures atomic readiness before server spawns (critical on 32-bit)
function seedJsonDatabaseSync(engineDir, userDbFile) {
  const seedCandidates = [
    path.join(engineDir, 'standalone', 'apps', 'web', 'data', 'lab_store.json'),
    path.join(engineDir, 'standalone', 'data', 'lab_store.json'),
    path.join(engineDir, 'data', 'lab_store.json'),
  ];
  for (const sc of seedCandidates) {
    try {
      if (fs.existsSync(sc)) {
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
        seedData.settings.labLicense = '';
        seedData.settings.isConfigured = false;
        delete seedData.license;
        fs.writeFileSync(userDbFile, JSON.stringify(seedData, null, 2), 'utf-8');
        console.log('[Desktop] Synchronously seeded clean JSON database to:', userDbFile);
        return;
      }
    } catch (e) {
      // Try next candidate
    }
  }
  console.warn('[Desktop] No seed JSON database found in any candidate path');
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
        } catch (e) {
          try {
            fs.cpSync(staticSrc, staticDest, { recursive: true });
          } catch (cpErr) {}
        }
      }
    }

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
        } catch (e) {
          try {
            fs.cpSync(publicSrc, publicDest, { recursive: true });
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
      priorityWeight: 100,
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

  valid.sort((a, b) => {
    const timeDiff = b.mtimeMs - a.mtimeMs;
    if (Math.abs(timeDiff) > 2000) {
      return timeDiff;
    }
    return b.priorityWeight - a.priorityWeight;
  });

  const selected = valid[0];
  ensureStandaloneAssets(selected.appDir, webDir);
  return selected;
}

// Find Next.js CLI binary or bundled standalone server to spawn Node directly
function getStartCommand(projectRoot, portToUse = WEB_PORT) {
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

    // Seed initial JSON database synchronously (prevents race condition on 32-bit / first launch)
    const userDbFile = path.join(userDataDir, 'lab_store.json');
    let needsJsonSeed = !fs.existsSync(userDbFile);
    if (!needsJsonSeed) {
      try {
        if (fs.statSync(userDbFile).size < 50) needsJsonSeed = true;
      } catch (e) {
        needsJsonSeed = true;
      }
    }
    if (needsJsonSeed) {
      seedJsonDatabaseSync(engineDir, userDbFile);
    }

    const normalizedDbUrl =
      'file:' + userSqliteDb.replace(/\\/g, '/') + '?connection_limit=1&socket_timeout=10000&busy_timeout=5000';

    const compileCacheDir = path.join(userDataDir, 'compile-cache');
    try {
      if (!fs.existsSync(compileCacheDir)) fs.mkdirSync(compileCacheDir, { recursive: true });
    } catch (e) {}

    const extraEnv = {
      LABRYO_DATA_DIR: userDataDir,
      DATABASE_URL: normalizedDbUrl,
      HOSTNAME: '0.0.0.0',
      PORT: String(portToUse),
      NODE_ENV: 'production',
      NODE_COMPILE_CACHE: compileCacheDir,
      LABRYO_APP_VERSION: app.getVersion(),
      NODE_SKIP_PLATFORM_CHECK: '1',
    };

    // Cap V8 memory on 32-bit/legacy architectures to prevent VirtualAlloc OOM crashes on 2GB RAM PCs
    if (process.arch === 'ia32' || (process.versions.electron && process.versions.electron.startsWith('22.'))) {
      extraEnv.NODE_OPTIONS = '--max-old-space-size=768';
      delete extraEnv.NODE_COMPILE_CACHE;
    }

    return {
      cmd: fs.existsSync(nodeBin) ? nodeBin : 'node',
      args: [serverScript],
      cwd: workingDir,
      extraEnv,
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
        PORT: String(portToUse),
        NODE_ENV: 'development',
        LABRYO_APP_VERSION: app.getVersion(),
        NODE_SKIP_PLATFORM_CHECK: '1',
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

  const standalone = findFreshestStandaloneServer(projectRoot);
  if (standalone) {
    const compileCacheDir = path.join(standalone.dataDir, 'compile-cache');
    try {
      if (!fs.existsSync(compileCacheDir)) fs.mkdirSync(compileCacheDir, { recursive: true });
    } catch (e) {}

    return {
      cmd: nodeCmd,
      args: [standalone.script],
      cwd: standalone.cwd,
      extraEnv: {
        LABRYO_DATA_DIR: standalone.dataDir,
        HOSTNAME: '0.0.0.0',
        PORT: String(portToUse),
        NODE_ENV: 'production',
        NODE_COMPILE_CACHE: compileCacheDir,
        LABRYO_APP_VERSION: app.getVersion(),
        NODE_SKIP_PLATFORM_CHECK: '1',
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
        args: [bin, 'start', '-H', '0.0.0.0', '-p', String(portToUse)],
        cwd: path.join(projectRoot, 'apps', 'web'),
        extraEnv: {
          NODE_SKIP_PLATFORM_CHECK: '1',
        },
      };
    }
  }

  const isWin = process.platform === 'win32';
  return {
    cmd: isWin ? 'npm.cmd' : 'npm',
    args: ['run', 'start:web'],
    cwd: projectRoot,
    extraEnv: {
      PORT: String(portToUse),
      NODE_SKIP_PLATFORM_CHECK: '1',
    },
  };
}

// Reliable TCP port check (allows up to 350ms on heavy CPU cold-boot on old PCs)
function checkTcpPort(port, host = '127.0.0.1', timeoutMs = 350) {
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

// Fast HTTP Health & Readiness Check once port is open — verifies genuine Labryo response
function checkHttpHealth(port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const req = http.get(`http://127.0.0.1:${port}/ready`, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            if (parsed && (parsed.ready === true || parsed.status === 'READY')) {
              return finish(true);
            }
          } catch (e) {}
          finish(false);
        });
      } else {
        res.resume();
        finish(false);
      }
    });

    req.on('error', () => {
      const fb = http.get(`http://127.0.0.1:${port}/health`, (res2) => {
        if (res2.statusCode >= 200 && res2.statusCode < 300) {
          let raw2 = '';
          res2.on('data', (c) => {
            raw2 += c;
          });
          res2.on('end', () => {
            try {
              const p2 = JSON.parse(raw2);
              if (p2 && p2.status === 'OK') return finish(true);
            } catch (e) {}
            finish(false);
          });
        } else {
          res2.resume();
          finish(false);
        }
      });
      fb.on('error', () => finish(false));
      fb.setTimeout(timeoutMs, () => {
        try {
          fb.abort();
        } catch (e) {}
        finish(false);
      });
    });

    req.setTimeout(timeoutMs, () => {
      try {
        req.abort();
      } catch (e) {}
      finish(false);
    });
  });
}

// Check if web server is responsive with robust 2-stage validation + fallback
async function isServerReady(port = WEB_PORT) {
  const portOpen = await checkTcpPort(port, '127.0.0.1', 300);
  if (!portOpen) {
    return false;
  }
  return await checkHttpHealth(port, 2500);
}

// Universal native port liberation (works on Windows 7, 8, 10, 11 via netstat + taskkill)
function freePortIfOccupied(port) {
  if (process.platform !== 'win32') return;
  try {
    const stdout = execSync('netstat -ano -p tcp', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
      timeout: 3000,
    });
    const lines = stdout.split('\n');
    const portSuffix = `:${port}`;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 5) continue;
      const localAddr = parts[1] || '';
      const pid = parts[parts.length - 1];
      // Match port suffix regardless of OS language for 'LISTENING' state
      if (localAddr.endsWith(portSuffix) && /^\d+$/.test(pid)) {
        if (pid !== '0' && pid !== String(process.pid)) {
          try {
            console.log(`[Desktop] Liberating port ${port} by terminating PID ${pid}`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', windowsHide: true, timeout: 2000 });
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

// Find an available port if 8080 is locked by an unkillable third-party service (e.g. XAMPP/Oracle/System)
async function resolveAvailablePort(preferredPort = 8080) {
  // 1. If our Labryo server is already running on preferredPort, reuse it
  if (await isServerReady(preferredPort)) {
    return { port: preferredPort, alreadyRunning: true };
  }

  // 2. If preferredPort is occupied by something else, try to liberate it first
  const isOccupied = await checkTcpPort(preferredPort, '127.0.0.1', 250);
  if (isOccupied) {
    freePortIfOccupied(preferredPort);
    await new Promise((r) => setTimeout(r, 200));
  }

  // 3. Check if preferredPort is now free (or became ready)
  if (await isServerReady(preferredPort)) {
    return { port: preferredPort, alreadyRunning: true };
  }
  if (!(await checkTcpPort(preferredPort, '127.0.0.1', 200))) {
    return { port: preferredPort, alreadyRunning: false };
  }

  // 4. Preferred port is still occupied by an external process we cannot kill -> pick first free fallback port
  for (const candidate of FALLBACK_PORTS) {
    if (candidate === preferredPort) continue;
    if (await isServerReady(candidate)) {
      return { port: candidate, alreadyRunning: true };
    }
    if (!(await checkTcpPort(candidate, '127.0.0.1', 150))) {
      console.log(`[Desktop] Port ${preferredPort} busy by external app; falling back to free port ${candidate}`);
      return { port: candidate, alreadyRunning: false };
    }
  }

  return { port: preferredPort, alreadyRunning: false };
}

// Kill backend process cleanly with atomic idempotency
function killBackendProcess(options = {}) {
  try {
    if (deviceBridgeService) deviceBridgeService.stop();
  } catch (e) {}
  const isForRestart = options.forRestart === true;
  if (isForRestart) {
    isShuttingDown = false;
  } else {
    if (isShuttingDown) return;
    isShuttingDown = true;
  }

  if (backendProcess && backendProcess.pid) {
    const pid = backendProcess.pid;
    backendProcess = null;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore', windowsHide: true, timeout: 2500 });
      } else {
        try {
          process.kill(pid, 'SIGKILL');
        } catch (e) {}
      }
    } catch (e) {}
  }

  if (process.platform === 'win32' && !isForRestart) {
    try {
      freePortIfOccupied(WEB_PORT);
    } catch (e) {}
  }
}

// Start local production server if not already running
async function ensureServerStarted(options = {}) {
  try {
    const isDevMode = process.env.LABRYO_DEV === '1' || process.argv.includes('--dev');
    if (isDevMode) {
      const ready = await isServerReady(WEB_PORT);
      if (ready) return true;
      const portOpen = await checkTcpPort(WEB_PORT, '127.0.0.1', 150);
      if (portOpen) {
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (await checkHttpHealth(WEB_PORT, 2000)) return true;
        }
      }
    }

    const resolved = await resolveAvailablePort(
      options.forceFallbackPort ? FALLBACK_PORTS.find((p) => p !== WEB_PORT) || 8085 : WEB_PORT
    );
    WEB_PORT = resolved.port;
    if (resolved.alreadyRunning) {
      console.log('[Desktop] Web server is already running on port', WEB_PORT);
      return true;
    }

    console.log('[Desktop] Starting background web server on port', WEB_PORT);
    const projectRoot = findProjectRoot();
    const startConfig = getStartCommand(projectRoot, WEB_PORT);
    console.log('[Desktop] Spawning server:', startConfig.cmd, startConfig.args.join(' '));

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(WEB_PORT),
      NODE_SKIP_PLATFORM_CHECK: '1',
      ...(startConfig.extraEnv || {}),
    };

    if (options.disableCompileCache) {
      delete env.NODE_COMPILE_CACHE;
    }

    let engineLogStream = null;
    let engineLogFile = null;
    try {
      const logDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      engineLogFile = path.join(logDir, 'engine.log');

      // Safe automated log rotation (Cap at 5 MB to prevent disk exhaustion)
      if (fs.existsSync(engineLogFile)) {
        try {
          const stats = fs.statSync(engineLogFile);
          if (stats.size > 5 * 1024 * 1024) {
            const backupLog = path.join(logDir, 'engine.log.old');
            if (fs.existsSync(backupLog)) {
              try { fs.unlinkSync(backupLog); } catch (e) {}
            }
            fs.renameSync(engineLogFile, backupLog);
          }
        } catch (rotErr) {}
      }

      engineLogStream = fs.createWriteStream(engineLogFile, { flags: 'a' });
      engineLogStream.on('error', () => {});
      engineLogStream.write(
        `\n=== [${new Date().toISOString()}] Server Spawned (Port ${WEB_PORT}): ${startConfig.cmd} ${startConfig.args.join(' ')} ===\n`
      );
    } catch (e) {
      engineLogStream = null;
    }

    backendProcess = spawn(startConfig.cmd, startConfig.args, {
      cwd: startConfig.cwd,
      shell: startConfig.cmd.endsWith('.cmd') || startConfig.cmd.endsWith('.bat'),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      detached: false,
      env,
    });

    if (backendProcess.stdout && engineLogStream) {
      backendProcess.stdout.on('data', (chunk) => {
        try {
          engineLogStream.write(chunk);
        } catch (e) {}
      });
    }
    if (backendProcess.stderr && engineLogStream) {
      backendProcess.stderr.on('data', (chunk) => {
        try {
          const str = chunk.toString();
          if (str.includes('Bad MAC')) {
            // Suppress continuous Bad MAC session spam to protect disk space
            return;
          }
          engineLogStream.write(chunk);
        } catch (e) {}
      });
    }

    backendProcess.on('error', (err) => {
      const msg = `[Desktop] Failed to spawn web server: ${err?.message || err}\n`;
      console.error(msg);
      if (engineLogFile) {
        try {
          fs.appendFileSync(engineLogFile, msg);
        } catch (e) {}
      }
    });

    backendProcess.on('exit', (code, signal) => {
      const msg = `[Desktop] Web server process exited with code ${code}, signal ${signal}\n`;
      console.warn(msg);
      if (engineLogFile) {
        try {
          fs.appendFileSync(engineLogFile, msg);
        } catch (e) {}
      }
    });

    return false;
  } catch (err) {
    console.error('[Desktop] Critical error in ensureServerStarted:', err);
    return false;
  }
}

// Update splash status text dynamically
function updateSplashStatus(text) {
  for (const win of [splashWindow, mainWindow]) {
    if (win && !win.isDestroyed()) {
      const script = `
        var el = document.getElementById('status-text') || document.getElementById('auto-text');
        if (el) { el.innerText = ${JSON.stringify(text)}; }
      `;
      win.webContents.executeJavaScript(script).catch(() => {});
    }
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

// Embedded calm auto-connecting screen HTML (used only if an ultra-slow HDD takes > 120s)
function getErrorHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Labryo LIMS - جاري استكمال التشغيل</title>
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
      background: rgba(15, 23, 42, 0.92);
      border-radius: 20px;
      border: 1px solid rgba(6, 182, 212, 0.35);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
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
      border: 1px solid rgba(6, 182, 212, 0.35);
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
      margin-bottom: 22px;
    }
    .progress-track {
      width: 100%;
      height: 6px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      margin-bottom: 20px;
    }
    .progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 45%;
      background: linear-gradient(90deg, #06b6d4, #10b981);
      border-radius: 6px;
      animation: indeterminate 1.4s infinite ease-in-out;
    }
    @keyframes indeterminate {
      0% { left: -45%; width: 45%; }
      50% { left: 30%; width: 50%; }
      100% { left: 100%; width: 45%; }
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
      margin-top: 18px;
      font-size: 12.5px;
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
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    </div>
    <h2>جاري استكمال تشغيل محرك النظام</h2>
    <p>يتم الآن تهيئة قاعدة البيانات وملفات المختبر لهذا الجهاز. سيفتح النظام تلقائياً فور جاهزيته دون الحاجة لإغلاق النافذة.</p>
    <div class="progress-track">
      <div class="progress-bar"></div>
    </div>
    <div class="btn-group">
      <button id="retry-btn" onclick="doManualRetry()">تنشيط الاتصال الآن</button>
    </div>
    <div class="auto-retry-notice">
      <span class="dot-pulse"></span>
      <span id="auto-text">جاري الفحص والاتصال التلقائي بالمحرك المحلي...</span>
    </div>
  </div>

  <script>
    function doManualRetry() {
      const btn = document.getElementById('retry-btn');
      const txt = document.getElementById('auto-text');
      if (btn) {
        btn.innerText = 'جاري تنشيط المحرك وفتح الواجهة...';
        btn.disabled = true;
      }
      if (txt) {
        txt.innerText = 'جاري إعادة تنشيط المحرك المحلي... يرجى الانتظار لحظات';
      }
      if (window.electronDesktop && typeof window.electronDesktop.retryServer === 'function') {
        window.electronDesktop.retryServer();
      } else {
        window.location.href = 'http://127.0.0.1:${WEB_PORT}/__electron_retry__';
      }
      setTimeout(() => {
        if (btn) {
          btn.innerText = 'تنشيط الاتصال الآن';
          btn.disabled = false;
        }
      }, 4000);
    }

    let autoTimer = setInterval(async () => {
      try {
        let res = await fetch('http://127.0.0.1:${WEB_PORT}/ready', { cache: 'no-store' }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch('http://127.0.0.1:${WEB_PORT}/health', { cache: 'no-store' }).catch(() => null);
        }
        if (res && res.ok) {
          clearInterval(autoTimer);
          window.location.href = 'http://127.0.0.1:${WEB_PORT}';
        }
      } catch (e) {}
    }, 1000);
  </script>
</body>
</html>`;
}

// Main-process background recovery loop (immune to browser CORS; auto-loads app the instant server responds)
function startMainProcessRecoveryLoop() {
  if (recoveryInterval) return;
  let ticks = 0;
  recoveryInterval = setInterval(async () => {
    if (isQuitting) {
      clearInterval(recoveryInterval);
      recoveryInterval = null;
      return;
    }
    ticks++;
    try {
      const ready = await isServerReady(WEB_PORT);
      if (ready) {
        clearInterval(recoveryInterval);
        recoveryInterval = null;
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.destroy();
          splashWindow = null;
        }
        if (!mainWindow || mainWindow.isDestroyed()) {
          createMainWindow();
        }
        mainWindow.loadURL(`http://127.0.0.1:${WEB_PORT}`);
        if (!mainWindow.isVisible()) {
          mainWindow.show();
          mainWindow.maximize();
        }
        mainWindow.focus();
        return;
      }

      // Every 6 seconds, if backend process exited, respawn it (with fallback port if needed)
      if (ticks % 6 === 0 && (!backendProcess || backendProcess.exitCode !== null)) {
        console.warn('[Desktop Recovery] Backend process not running, respawning...');
        await ensureServerStarted({
          forceFallbackPort: ticks >= 12,
          disableCompileCache: ticks >= 6,
        });
      }
    } catch (e) {}
  }, 1000);
}

// Main sequence to poll server and seamlessly transition from splash to main window
async function startAndLoadApp(serverStartPromise = null) {
  tracer.mark('Server Startup Sequence Triggered (T2)');
  updateSplashStatus('جاري إقلاع محرك النظام المحلي...');
  try {
    if (serverStartPromise) {
      await serverStartPromise;
    } else {
      await ensureServerStarted();
    }
  } catch (err) {
    console.error('[Desktop] Error awaiting server start promise:', err);
  }

  let ready = false;
  let attempts = 0;
  const pollIntervalMs = 120;
  const maxAttempts = 1000; // 120-second patient startup budget for older HDDs & antivirus scans
  const startPollTime = Date.now();
  let statusStage = 0;

  while (attempts < maxAttempts) {
    ready = await isServerReady(WEB_PORT);
    if (ready) {
      tracer.mark(`Server Ready Detected on attempt #${attempts} (${Date.now() - startPollTime}ms) (T3)`);
      break;
    }

    // Immediate self-healing: if backend process crashed or exited prematurely, respawn right away
    if (attempts > 15 && attempts % 25 === 0 && (!backendProcess || backendProcess.exitCode !== null)) {
      console.warn(`[Desktop] Backend process exited prematurely on attempt #${attempts}, self-healing respawn...`);
      await ensureServerStarted({
        forceFallbackPort: attempts >= 50,
        disableCompileCache: true,
      });
    }

    const realElapsed = Date.now() - startPollTime;
    if (statusStage === 0) {
      updateSplashStatus('جاري إقلاع محرك النظام المحلي...');
      statusStage = 1;
    } else if (statusStage === 1 && realElapsed >= 3000) {
      updateSplashStatus('جاري فحص وتأمين قاعدة البيانات...');
      statusStage = 2;
    } else if (statusStage === 2 && realElapsed >= 8000) {
      updateSplashStatus('جاري تحميل واجهات التحاليل والكتالوج...');
      statusStage = 3;
    } else if (statusStage === 3 && realElapsed >= 16000) {
      updateSplashStatus('جاري استكمال إعدادات النظام وتجهيز الواجهة...');
      statusStage = 4;
    } else if (statusStage === 4 && realElapsed >= 28000) {
      updateSplashStatus('جاري تهيئة خدمات النظام للأجهزة... يرجى الانتظار لحظات');
      statusStage = 5;
    } else if (statusStage === 5 && realElapsed >= 45000) {
      updateSplashStatus('جاري إتمام الفحص الأولي لملفات التشغيل...');
      statusStage = 6;
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
    attempts++;
  }

  const appUrl = `http://127.0.0.1:${WEB_PORT}`;

  if (ready) {
    if (recoveryInterval) {
      clearInterval(recoveryInterval);
      recoveryInterval = null;
    }
    updateSplashStatus('اكتمل التجهيز — جاري فتح واجهة النظام...');

    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
    }

    tracer.mark('Navigating Main Window to App URL (T4)');
    mainWindow.loadURL(appUrl);

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

      // Pre-warm primary business routes sequentially in background after UI is active
      setTimeout(() => {
        try {
          const prefetchRoutes = ['/results', '/patients', '/samples', '/financials', '/catalog'];
          prefetchRoutes.forEach((route, i) => {
            setTimeout(() => {
              http
                .get(`http://127.0.0.1:${WEB_PORT}${route}`, (res) => {
                  res.resume();
                })
                .on('error', () => {});
            }, i * 350);
          });
        } catch (e) {}
      }, 2500);

      // Start Medical Device Bridge Daemon on 0.0.0.0:5000 (ASTM E1381/HL7)
      if (deviceBridgeService) {
        setTimeout(() => {
          try {
            deviceBridgeService
              .start({
                port: Number(process.env.DEVICE_TCP_PORT) || 5000,
                host: '0.0.0.0',
                webPort: WEB_PORT,
              })
              .catch((err) => {
                console.warn('[Desktop] Device Bridge daemon notice:', err.message);
              });
          } catch (e) {}
        }, 1500);
      }
    };

    mainWindow.once('ready-to-show', revealMainWindow);
    mainWindow.webContents.once('dom-ready', () => {
      tracer.mark('DOM Content Ready (T4.5)');
      setTimeout(revealMainWindow, 20);
    });

    setTimeout(revealMainWindow, 2000);
  } else {
    // Even after 120s, keep main-process auto-recovery polling active so it enters automatically
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
    }
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getErrorHtml()));
    mainWindow.show();
    mainWindow.maximize();
    startMainProcessRecoveryLoop();
  }
}

// Show or restore main window instantly
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
    path.join(__dirname, 'assets', 'app.ico'),
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(process.resourcesPath || '', 'assets', 'app.ico'),
    path.join(process.resourcesPath || '', 'assets', 'icon.png'),
    path.join(findProjectRoot(), 'apps', 'desktop', 'assets', 'app.ico'),
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
            startMainProcessRecoveryLoop();
          },
        },
        {
          label: '☁️ التحقق من وجود تحديثات...',
          click: () => {
            updateService.checkForUpdates(true);
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

  const winIcon = getWindowIcon();

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

// Create silent main window (initially hidden until content is ready)
function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return;

  const winIcon = getWindowIcon();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1000,
    minHeight: 680,
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
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Intercept fallback retry navigation from data: URL if preload wasn't used
  mainWindow.webContents.on('will-navigate', async (event, url) => {
    if (url && url.includes('__electron_retry__')) {
      event.preventDefault();
      if (!backendProcess || backendProcess.exitCode !== null) {
        await ensureServerStarted({ disableCompileCache: true });
      }
      startMainProcessRecoveryLoop();
    }
  });

  // Self-heal if page navigation ever fails due to transient startup delay
  mainWindow.webContents.on('did-fail-load', (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return; // Ignore aborted loads
    if (validatedURL && validatedURL.startsWith('http://127.0.0.1')) {
      console.warn(`[Desktop] Main frame failed to load (${errorCode}), activating auto-recovery...`);
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(getErrorHtml()));
      startMainProcessRecoveryLoop();
    }
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
ipcMain.on('server:retry-now', async () => {
  const ready = await isServerReady(WEB_PORT);
  if (ready) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(`http://127.0.0.1:${WEB_PORT}`);
    }
    return;
  }
  if (!backendProcess || backendProcess.exitCode !== null) {
    await ensureServerStarted({ disableCompileCache: true });
  }
  startMainProcessRecoveryLoop();
});

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
  if (!url || typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      shell.openExternal(parsed.href);
    } else {
      console.warn('[Desktop Security] Blocked non-http/https external protocol navigation:', parsed.protocol);
    }
  } catch (err) {
    console.warn('[Desktop Security] Invalid external URL rejected:', err?.message);
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('print-document', async (event, { url, printOptions }) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  try {
    const parsed = new URL(url);
    const isLoopback =
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
      (Number(parsed.port) === WEB_PORT || FALLBACK_PORTS.includes(Number(parsed.port))) &&
      parsed.protocol === 'http:';
    if (!isLoopback) {
      console.warn('[Desktop Security] print-document blocked non-local URL:', url);
      return { success: false, error: `Print URL must be local 127.0.0.1:${WEB_PORT}` };
    }
  } catch {
    return { success: false, error: 'Invalid print URL' };
  }

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

ipcMain.handle('report:generate-image', async (_event, { sampleId, section }) => {
  const hiddenWin = new BrowserWindow({
    show: false,
    width: 840,
    height: 1122,
    backgroundColor: '#ffffff',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  try {
    const qs = section ? `section=${encodeURIComponent(section)}&mode=single&force=true` : 'mode=single&force=true';
    const reportUrl = `http://127.0.0.1:${WEB_PORT}/api/samples/${sampleId}/print?${qs}`;
    await hiddenWin.loadURL(reportUrl);
    await hiddenWin.webContents.executeJavaScript('document.fonts.ready').catch(() => {});

    const cardCount = await hiddenWin.webContents
      .executeJavaScript('document.querySelectorAll(".report-card").length')
      .catch(() => 0);

    const dataUrls = [];

    if (cardCount > 0) {
      for (let i = 0; i < cardCount; i++) {
        const cardH = await hiddenWin.webContents
          .executeJavaScript(`
            (function() {
              var cards = document.querySelectorAll('.report-card');
              for (var k = 0; k < cards.length; k++) {
                cards[k].style.display = (k === ${i}) ? 'flex' : 'none';
                cards[k].style.margin = '0 auto';
              }
              window.scrollTo(0, 0);
              var target = cards[${i}];
              return target ? Math.ceil(target.getBoundingClientRect().height) : 1122;
            })()
          `)
          .catch(() => 1122);

        const targetH = Math.max(Math.min(cardH, 1600), 900);
        hiddenWin.setContentSize(840, targetH);
        await new Promise((r) => setTimeout(r, 60));
        const img = await hiddenWin.webContents.capturePage({ x: 0, y: 0, width: 840, height: targetH });
        dataUrls.push(img.toDataURL());
      }
    } else {
      const scrollH = await hiddenWin.webContents
        .executeJavaScript('Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 1100)')
        .catch(() => 1100);
      const targetH = Math.max(Math.min(scrollH + 20, 1600), 900);
      hiddenWin.setContentSize(840, targetH);
      const image = await hiddenWin.webContents.capturePage();
      dataUrls.push(image.toDataURL());
    }

    return { success: true, dataUrl: dataUrls[0] || '', dataUrls };
  } catch (err) {
    console.error('[Desktop] Failed generating report image natively:', err);
    return { success: false, error: err?.message || String(err) };
  } finally {
    try {
      hiddenWin.close();
    } catch {}
  }
});

ipcMain.handle('clipboard:read-text', () => {
  const { clipboard } = require('electron');
  return clipboard.readText();
});

ipcMain.handle('clipboard:write-image', async (_event, payload) => {
  try {
    const { clipboard, nativeImage } = require('electron');
    const base64Data = typeof payload === 'string' ? payload : payload?.base64Data;
    if (!base64Data) return { success: false, error: 'Missing image data' };
    const clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const img = nativeImage.createFromBuffer(Buffer.from(clean, 'base64'));
    clipboard.writeImage(img);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message };
  }
});

function resolveWhatsAppAutoPasteScript() {
  const candidates = [];
  if (app.isPackaged) {
    // electron-builder unpacks services/** via "asarUnpack" so external processes (PowerShell) can read the script.
    candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'services', 'whatsappAutoPaste.ps1'));
    candidates.push(path.join(process.resourcesPath, 'services', 'whatsappAutoPaste.ps1'));
    candidates.push(
      path.join(process.resourcesPath, 'engine', 'standalone', 'apps', 'desktop', 'services', 'whatsappAutoPaste.ps1')
    );
  }
  candidates.push(path.join(__dirname, 'services', 'whatsappAutoPaste.ps1'));
  const found = candidates.find((candidate) => fs.existsSync(candidate)) || null;
  if (!found) return null;
  if (found.includes('app.asar')) {
    try {
      const tempScript = path.join(require('os').tmpdir(), 'labryo-whatsappAutoPaste.ps1');
      fs.writeFileSync(tempScript, fs.readFileSync(found));
      return tempScript;
    } catch (e) {}
  }
  return found;
}

ipcMain.handle('whatsapp:share-direct', async (_event, { phone, imageBase64, imagesBase64, caption }) => {
  const trace = (m) => {
    try {
      fs.appendFileSync(
        path.join(require('os').tmpdir(), 'labryo-wa-share.log'),
        '[' + new Date().toISOString() + '] ' + m + '\n'
      );
    } catch {}
  };
  try {
    const allImages =
      Array.isArray(imagesBase64) && imagesBase64.length > 0
        ? imagesBase64.filter(Boolean)
        : imageBase64
          ? [imageBase64]
          : [];

    trace(
      'share-direct invoked phone=' +
        String(phone || '').slice(0, 6) +
        '*** imageCount=' +
        allImages.length +
        ' captionLen=' +
        String(caption || '').length
    );
    const { clipboard, nativeImage } = require('electron');
    const tempPaths = [];
    const ts = Date.now();

    for (let idx = 0; idx < allImages.length; idx++) {
      const rawB64 = allImages[idx];
      const clean = String(rawB64).replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(clean, 'base64');
      const img = nativeImage.createFromBuffer(buf);
      if (img.isEmpty()) continue;

      if (idx === 0) {
        clipboard.writeImage(img);
        trace('first image written to clipboard ' + JSON.stringify(img.getSize()));
      }

      try {
        const tempImg = path.join(require('os').tmpdir(), `labryo-wa-${ts}-${idx + 1}.png`);
        fs.writeFileSync(tempImg, buf);
        tempPaths.push(tempImg);
        trace(`temp image #${idx + 1} written for automator: ` + tempImg);
      } catch (fErr) {
        trace('temp image write error: ' + (fErr && fErr.message));
      }
    }

    let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('07') && cleanPhone.length === 11) cleanPhone = '964' + cleanPhone.slice(1);
    else if (cleanPhone.startsWith('7') && cleanPhone.length === 10) cleanPhone = '964' + cleanPhone;
    if (!cleanPhone) return { success: false, error: 'رقم الهاتف غير صالح' };

    const encodedText = caption ? encodeURIComponent(caption) : '';
    const targetUrl = 'whatsapp://send?phone=' + cleanPhone + (encodedText ? '&text=' + encodedText : '');

    let opened = false;
    let openError = '';
    try {
      await shell.openExternal(targetUrl);
      opened = true;
      trace('openExternal(whatsapp://) ok');
    } catch (e) {
      openError = e && e.message ? e.message : String(e);
      trace('openExternal failed: ' + openError + ' -> trying cmd start');
      try {
        const { execFile } = require('child_process');
        await new Promise((resolve, reject) =>
          execFile('cmd.exe', ['/c', 'start', '', targetUrl], { windowsHide: true }, (err) =>
            err ? reject(err) : resolve()
          )
        );
        opened = true;
        trace('cmd start ok');
      } catch (e2) {
        openError = e2 && e2.message ? e2.message : openError;
        trace('cmd start failed: ' + openError);
      }
    }
    if (!opened) return { success: false, error: 'تطبيق واتساب لسطح المكتب غير مثبت أو لا يستجيب' };

    if (allImages.length > 0 && tempPaths.length === 0) {
      trace('no valid report images could be decoded');
      return { success: false, error: 'تعذر تجهيز صور التقرير الطبي للإرسال. أعد المحاولة.' };
    }

    if (tempPaths.length > 0) {
      const autoPasteScript = resolveWhatsAppAutoPasteScript();
      trace('auto-paste script resolved: ' + (autoPasteScript || 'NOT FOUND'));
      if (!autoPasteScript) {
        return {
          success: false,
          error: 'تعذر العثور على ملف أتمتة اللصق (whatsappAutoPaste.ps1). يرجى تحديث التطبيق.',
        };
      }

      const captionFile = path.join(require('os').tmpdir(), 'labryo-wa-caption-' + ts + '.txt');
      if (caption) fs.writeFileSync(captionFile, caption, 'utf8');

      const pasteArgs = [
        '-STA',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        autoPasteScript,
        '-Phone',
        cleanPhone,
        '-SkipProtocolLaunch',
        '-ImagePath',
        tempPaths[0],
        '-ImagePaths',
        tempPaths.join('|'),
      ];
      if (caption) pasteArgs.push('-CaptionFile', captionFile);

      const pasteResult = await new Promise((resolve) => {
        const { execFile } = require('child_process');
        execFile(
          'powershell.exe',
          pasteArgs,
          { windowsHide: true, timeout: 60000 },
          (err, _stdout, stderr) => {
            if (err) {
              trace('auto-paste failed: ' + (stderr || err.message) + ' (code=' + (err.code || '?') + ')');
              resolve({
                success: false,
                error: 'تم فتح واتساب لكن تعذر لصق صور التقرير تلقائياً. أعد المحاولة أو أرفق الصور يدوياً.',
              });
            } else {
              trace('auto-paste completed successfully');
              resolve({ success: true });
            }
          }
        );
      });

      if (!pasteResult.success) {
        return { success: false, mode: 'desktop', error: pasteResult.error };
      }
    }

    return { success: true, mode: 'desktop' };
  } catch (err) {
    trace('EXCEPTION ' + (err && err.message));
    return { success: false, error: err && err.message };
  }
});

// App Lifecycle
app.whenReady().then(() => {
  tracer.mark('Electron Ready (T1)');

  // Start background web server immediately
  const serverStartPromise = ensureServerStarted();

  // Disable automatic background launch with Windows boot
  configureAutoLaunch(false);

  // Show lightweight splash window first so Node.js backend gets 100% of CPU & Disk I/O during cold boot
  createSplashWindow();
  tracer.mark('Splash Window Created');

  startAndLoadApp(serverStartPromise).then(() => {
    updateService.setBeforeInstallHandler(() => {
      isQuitting = true;
      killBackendProcess();
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      updateService.init(mainWindow);
    }
  });

  app.on('activate', () => {
    showMainWindow();
  });
});

app.on('second-instance', () => {
  showMainWindow();
});

app.on('before-quit', () => {
  if (recoveryInterval) {
    clearInterval(recoveryInterval);
    recoveryInterval = null;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.hide();
    } catch (e) {}
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    try {
      splashWindow.destroy();
      splashWindow = null;
    } catch (e) {}
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
