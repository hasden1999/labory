const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function compareSemver(v1, v2) {
  if (!v1 || !v2) return 0;
  const parse = (v) => String(v).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

class UpdateService {
  constructor() {
    this.state = {
      status: 'idle', // 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
      currentVersion: app.getVersion(),
      latestVersion: null,
      releaseNotes: null,
      releaseDate: null,
      isCritical: false,
      channel: 'stable',
      progress: {
        percent: 0,
        bytesPerSecond: 0,
        transferred: 0,
        total: 0,
      },
      error: null,
      lastChecked: null,
      loopDetected: false,
      manualDownloadUrl: null,
    };

    this.checkTimer = null;
    this.isManualCheck = false;
    this.logFile = null;
    this.mainWindow = null;
    this.listeners = new Set();
    this.beforeInstallHandler = null;
    this.updateHistory = null;
    this.isLoopLocked = false;
  }

  setBeforeInstallHandler(fn) {
    this.beforeInstallHandler = fn;
  }

  getState() {
    return this.state;
  }

  getChannel() {
    return this.state.channel;
  }

  setChannel(newChannel) {
    if (newChannel === 'stable' || newChannel === 'beta') {
      this.state.channel = newChannel;
      autoUpdater.allowPrerelease = newChannel === 'beta';
      this.saveSettings();
      this.broadcastState();
      this.log(`Update channel changed to: ${newChannel}`);
      return { success: true, channel: newChannel };
    }
    return { success: false, error: 'Invalid channel' };
  }

  onStateChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupLogging();
    this.loadSettings();
    this.verifyPostUpdateStatus();
    this.configureAutoUpdater();
    this.setupIpcHandlers();
    this.scheduleChecks();
    this.log(`UpdateService initialized. Version: ${this.state.currentVersion}`);
  }

  setupLogging() {
    try {
      const logsDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      this.logFile = path.join(logsDir, 'updater.log');
    } catch (e) {
      console.warn('[UpdateService] Failed to create logs directory:', e);
    }
  }

  log(msg, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${msg}\n`;
    console.log(`[UpdateService] ${line.trim()}`);
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, line, 'utf-8');
      } catch (e) {}
    }
  }

  loadSettings() {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'updater_settings.json');
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.channel === 'beta' || data.channel === 'stable') {
          this.state.channel = data.channel;
        }
        if (data.updateHistory) {
          this.updateHistory = data.updateHistory;
        }
      }
    } catch (e) {
      this.log('Error loading updater settings: ' + e.message, 'WARN');
    }
  }

  saveSettings() {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'updater_settings.json');
      const payload = {
        channel: this.state.channel,
        updateHistory: this.updateHistory,
      };
      fs.writeFileSync(settingsPath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      this.log('Error saving updater settings: ' + e.message, 'WARN');
    }
  }

  // Check if previous restart attempted an update and whether it succeeded
  verifyPostUpdateStatus() {
    if (!this.updateHistory || !this.updateHistory.targetVersion) return;

    const target = this.updateHistory.targetVersion;
    const current = this.state.currentVersion;
    const comparison = compareSemver(current, target);

    if (comparison >= 0) {
      this.log(`✅ Previous update to version ${target} verified successfully! Current version is now ${current}.`);
      this.updateHistory = null;
      this.saveSettings();
    } else {
      this.log(`⚠️ Previous update targeted ${target}, but current version is still ${current}. Attempt count: ${this.updateHistory.attempts || 1}`, 'WARN');
      if ((this.updateHistory.attempts || 1) >= 2) {
        this.isLoopLocked = true;
        this.state.loopDetected = true;
        this.state.status = 'error';
        this.state.latestVersion = target;
        this.state.error = `تعذر استكمال التحديث التلقائي إلى الإصدار (${target}) لاحتمال وجود ملفات أو خدمات ويندوز قيد الاستخدام. يرجى تثبيت التحديث يدوياً عبر المثبت الكامل أدناه.`;
        this.state.manualDownloadUrl = `https://github.com/hasden1999/lab-releases/releases/latest/download/Labryo.LIMS.Setup.${target}.exe`;
        this.log(`[LOOP-PREVENTION] Update loop locked for ${target}. Auto-prompt suppressed.`, 'WARN');
      }
    }
  }

  configureAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = this.state.channel === 'beta';

    autoUpdater.logger = {
      info: (m) => this.log(typeof m === 'object' ? JSON.stringify(m) : m, 'INFO'),
      warn: (m) => this.log(typeof m === 'object' ? JSON.stringify(m) : m, 'WARN'),
      error: (m) => this.log(typeof m === 'object' ? JSON.stringify(m) : m, 'ERROR'),
    };

    autoUpdater.on('checking-for-update', () => {
      this.updateState({ status: 'checking', error: null });
      this.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      this.log(`Update available: ${info.version} (current: ${this.state.currentVersion})`);
      
      // If loop protection is active for this version, do not prompt user to install again!
      if (this.isLoopLocked && this.updateHistory?.targetVersion === info.version) {
        this.log(`Update available for ${info.version}, but loop lock is active. Suppressing prompt.`, 'WARN');
        this.updateState({
          status: 'error',
          latestVersion: info.version,
          error: `تعذر التثبيت التلقائي للإصدار (${info.version}). يرجى تحميل المثبت الكامل وتثبيته يدوياً لحل التعارض.`,
          loopDetected: true,
          manualDownloadUrl: `https://github.com/hasden1999/lab-releases/releases/latest/download/Labryo.LIMS.Setup.${info.version}.exe`,
        });
        return;
      }

      const notes = typeof info.releaseNotes === 'string' ? info.releaseNotes : (Array.isArray(info.releaseNotes) ? info.releaseNotes.map(n => n.note).join('\n') : '');
      const isCritical = /\[critical\]|\[mandatory\]|\[إلزامي\]/i.test(notes || info.releaseName || '');

      this.updateState({
        status: 'available',
        latestVersion: info.version,
        releaseNotes: notes || 'تحسينات واستقرار في أداء النظام',
        releaseDate: info.releaseDate || new Date().toISOString(),
        isCritical,
        progress: { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 },
        loopDetected: false,
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      this.log(`System is up to date (${this.state.currentVersion}).`);
      // If we were previously pending an update that never arrived or is up-to-date, clear history
      if (this.updateHistory && compareSemver(this.state.currentVersion, this.updateHistory.targetVersion) >= 0) {
        this.updateHistory = null;
        this.isLoopLocked = false;
        this.saveSettings();
      }

      this.updateState({
        status: 'idle',
        latestVersion: info?.version || this.state.currentVersion,
        lastChecked: new Date().toISOString(),
        error: null,
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      if (this.isLoopLocked) return;
      this.updateState({
        status: 'downloading',
        progress: {
          percent: Math.round(progressObj.percent * 10) / 10,
          bytesPerSecond: progressObj.bytesPerSecond,
          transferred: progressObj.transferred,
          total: progressObj.total,
        },
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.log(`Update ${info.version} downloaded and verified (SHA-512 check passed). Ready to install.`);
      if (this.isLoopLocked && this.updateHistory?.targetVersion === info.version) {
        this.log(`Update ${info.version} downloaded, but loop lock is active. Suppressing prompt.`, 'WARN');
        return;
      }

      this.updateState({
        status: 'downloaded',
        latestVersion: info.version,
        progress: { percent: 100, bytesPerSecond: 0, transferred: this.state.progress.total, total: this.state.progress.total },
      });
    });

    autoUpdater.on('error', (err) => {
      const msg = err?.message || String(err);
      this.log(`Update error: ${msg}`, 'ERROR');
      
      const isNetworkError = /net::ERR|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|socket hang up|offline/i.test(msg);
      this.updateState({
        status: 'error',
        error: isNetworkError ? 'تعذر الاتصال بخادم التحديثات (الرجاء التحقق من الإنترنت)' : msg,
      });
    });
  }

  updateState(partial) {
    this.state = { ...this.state, ...partial };
    this.broadcastState();
  }

  broadcastState() {
    if (this.listeners) {
      for (const listener of this.listeners) {
        try { listener(this.state); } catch (e) {}
      }
    }
    if (this.mainWindow && (typeof this.mainWindow.isDestroyed !== 'function' || !this.mainWindow.isDestroyed())) {
      try {
        this.mainWindow.webContents?.send?.('updater:state-changed', this.state);
      } catch (e) {}
    }
  }

  scheduleChecks() {
    // 1. Initial check 30 seconds after app startup
    setTimeout(() => {
      if (app.isPackaged && !this.isLoopLocked) {
        this.checkForUpdates(false);
      } else {
        this.log('Automatic update check skipped (unpackaged or loop-locked).');
      }
    }, 30000);

    // 2. Periodic check every 4 hours
    this.checkTimer = setInterval(() => {
      if (app.isPackaged && !this.isLoopLocked) {
        this.checkForUpdates(false);
      }
    }, 4 * 60 * 60 * 1000);
  }

  async checkForUpdates(isManual = true) {
    this.isManualCheck = isManual;
    if (!app.isPackaged) {
      this.log('Cannot check for updates in unpackaged mode.', 'WARN');
      return { success: false, message: 'التحديث التلقائي يعمل في النسخة المثبتة فقط' };
    }

    if (this.isLoopLocked && !isManual) {
      this.log('Skipping automatic check: update loop lock is active.', 'WARN');
      return { success: false, loopDetected: true, message: this.state.error };
    }

    try {
      this.log(`Initiating update check (manual: ${isManual}, channel: ${this.state.channel})...`);
      const res = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: res?.updateInfo };
    } catch (err) {
      this.log(`Failed checking for updates: ${err.message}`, 'WARN');
      return { success: false, error: err.message };
    }
  }

  async downloadUpdate() {
    if (!app.isPackaged) return { success: false, message: 'Unpackaged mode' };
    try {
      this.log('Manual download triggered.');
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      this.log(`Download failed: ${err.message}`, 'ERROR');
      return { success: false, error: err.message };
    }
  }

  // Atomic and comprehensive backup: lab.db, lab.db-wal, lab.db-shm, lab_store.json
  createPreUpdateBackup() {
    try {
      this.log('Creating full pre-update database backup (SQLite WAL/SHM + JSON)...');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const baseDir = process.env.LABRYO_DATA_DIR || path.join(app.getPath('userData'), 'data');
      const backupsDir = path.join(baseDir, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      let copiedFiles = 0;

      // 1. Backup SQLite lab.db and all WAL/SHM journal files
      const sqliteFiles = ['lab.db', 'lab.db-wal', 'lab.db-shm', 'lab.db-journal'];
      for (const f of sqliteFiles) {
        const fullPath = path.join(baseDir, f);
        if (fs.existsSync(fullPath)) {
          fs.copyFileSync(fullPath, path.join(backupsDir, `pre_update_${dateStr}_${f}`));
          copiedFiles++;
        }
      }

      // 2. Backup lab_store.json and lab_store.json.bak
      const jsonFiles = ['lab_store.json', 'lab_store.json.bak'];
      for (const f of jsonFiles) {
        const fullPath = path.join(baseDir, f);
        if (fs.existsSync(fullPath)) {
          fs.copyFileSync(fullPath, path.join(backupsDir, `pre_update_${dateStr}_${f}`));
          copiedFiles++;
        }
      }

      this.log(`Pre-update backup completed safely in: ${backupsDir} (${copiedFiles} files secured).`);
      return true;
    } catch (e) {
      this.log(`Critical warning during pre-update backup: ${e.message}`, 'ERROR');
      return false;
    }
  }

  async quitAndInstall() {
    this.log('Preparing to quit and install update...');
    
    // 1. Record update attempt in settings for loop detection
    if (this.state.latestVersion) {
      const isSameVersion = this.updateHistory?.targetVersion === this.state.latestVersion;
      const currentAttempts = isSameVersion ? (this.updateHistory.attempts || 1) + 1 : 1;
      this.updateHistory = {
        targetVersion: this.state.latestVersion,
        attempts: currentAttempts,
        lastAttemptTime: new Date().toISOString(),
      };
      this.saveSettings();
    }

    // 2. Take full database backup before applying update
    const backupOk = this.createPreUpdateBackup();
    if (!backupOk) {
      this.log('Aborting quitAndInstall: Pre-update backup failed!', 'ERROR');
      this.updateState({
        status: 'error',
        error: 'فشل إنشاء نسخة احتياطية لقاعدة البيانات قبل التحديث. تم إلغاء العملية لحماية بيانات المختبر.',
      });
      return { success: false, error: 'Backup failed' };
    }

    // 3. Gracefully stop backend process and free locked handles
    if (typeof this.beforeInstallHandler === 'function') {
      try {
        this.log('Calling beforeInstallHandler to terminate backend server...');
        this.beforeInstallHandler();
      } catch (e) {
        this.log('Warning in beforeInstallHandler: ' + e.message, 'WARN');
      }
    }

    // 4. Forcefully stop any locked engine node processes or services on Windows
    if (process.platform === 'win32') {
      try {
        execSync('powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like \"*@lab-managerdesktop*\" } | Stop-Process -Force -ErrorAction SilentlyContinue"', { windowsHide: true, stdio: 'ignore' });
        execSync('net stop "LabryoLIMS"', { windowsHide: true, stdio: 'ignore' });
        execSync('net stop "LabryoService"', { windowsHide: true, stdio: 'ignore' });
      } catch (e) {}
    }

    // 5. Allow 800ms for windows and process handles to completely close before launching installer
    setTimeout(() => {
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        this.log('Error executing quitAndInstall: ' + err.message, 'ERROR');
      }
    }, 800);

    return { success: true };
  }

  setupIpcHandlers() {
    ipcMain.handle('updater:get-state', () => this.state);

    ipcMain.handle('updater:check', async () => {
      return await this.checkForUpdates(true);
    });

    ipcMain.handle('updater:download', async () => {
      return await this.downloadUpdate();
    });

    ipcMain.handle('updater:quit-and-install', async () => {
      return await this.quitAndInstall();
    });

    ipcMain.handle('updater:get-channel', () => this.state.channel);

    ipcMain.handle('updater:set-channel', (event, newChannel) => {
      if (newChannel === 'stable' || newChannel === 'beta') {
        this.state.channel = newChannel;
        autoUpdater.allowPrerelease = newChannel === 'beta';
        this.saveSettings();
        this.broadcastState();
        this.log(`Update channel changed to: ${newChannel}`);
        return { success: true, channel: newChannel };
      }
      return { success: false, error: 'Invalid channel' };
    });
  }
}

const updateService = new UpdateService();
module.exports = updateService;
module.exports.UpdateService = UpdateService;
module.exports.default = updateService;
