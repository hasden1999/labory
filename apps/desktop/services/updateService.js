const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

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
    };

    this.checkTimer = null;
    this.isManualCheck = false;
    this.logFile = null;
    this.mainWindow = null;
    this.listeners = new Set();
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
    this.configureAutoUpdater();
    this.setupIpcHandlers();
    this.scheduleChecks();
    this.log('UpdateService initialized successfully.');
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
      }
    } catch (e) {
      this.log('Error loading updater settings: ' + e.message, 'WARN');
    }
  }

  saveSettings() {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'updater_settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify({ channel: this.state.channel }, null, 2), 'utf-8');
    } catch (e) {
      this.log('Error saving updater settings: ' + e.message, 'WARN');
    }
  }

  configureAutoUpdater() {
    // Configure channels and behaviour
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = this.state.channel === 'beta';

    // Direct logger to our file
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
      const notes = typeof info.releaseNotes === 'string' ? info.releaseNotes : (Array.isArray(info.releaseNotes) ? info.releaseNotes.map(n => n.note).join('\n') : '');
      const isCritical = /\[critical\]|\[mandatory\]|\[إلزامي\]/i.test(notes || info.releaseName || '');

      this.updateState({
        status: 'available',
        latestVersion: info.version,
        releaseNotes: notes || 'تحسينات وإصلاحات عامة للنظام',
        releaseDate: info.releaseDate || new Date().toISOString(),
        isCritical,
        progress: { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 },
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      this.log(`System is up to date (${this.state.currentVersion}).`);
      this.updateState({
        status: 'idle',
        latestVersion: info?.version || this.state.currentVersion,
        lastChecked: new Date().toISOString(),
        error: null,
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
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
      this.updateState({
        status: 'downloaded',
        latestVersion: info.version,
        progress: { percent: 100, bytesPerSecond: 0, transferred: this.state.progress.total, total: this.state.progress.total },
      });
    });

    autoUpdater.on('error', (err) => {
      const msg = err?.message || String(err);
      this.log(`Update error: ${msg}`, 'ERROR');
      
      // If offline or network drop, keep it non-intrusive
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
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send('updater:state-changed', this.state);
      } catch (e) {}
    }
  }

  scheduleChecks() {
    // 1. Initial check 30 seconds after app startup
    setTimeout(() => {
      if (app.isPackaged) {
        this.checkForUpdates(false);
      } else {
        this.log('Development mode detected. Automatic update check skipped.');
      }
    }, 30000);

    // 2. Periodic check every 4 hours
    this.checkTimer = setInterval(() => {
      if (app.isPackaged) {
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

  createPreUpdateBackup() {
    try {
      this.log('Creating pre-update database backup for safety...');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const baseDir = process.env.LABRYO_DATA_DIR || path.join(process.cwd(), 'data');
      const backupsDir = path.join(baseDir, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      // 1. Backup lab_store.json
      const storeFile = path.join(baseDir, 'lab_store.json');
      if (fs.existsSync(storeFile)) {
        fs.copyFileSync(storeFile, path.join(backupsDir, `pre_update_${dateStr}_lab_store.json`));
      }

      // 2. Backup SQLite lab.db
      const sqliteFile = path.join(baseDir, 'lab.db');
      if (fs.existsSync(sqliteFile)) {
        fs.copyFileSync(sqliteFile, path.join(backupsDir, `pre_update_${dateStr}_lab.db`));
      }
      this.log('Pre-update backups saved successfully.');
    } catch (e) {
      this.log(`Warning during pre-update backup: ${e.message}`, 'WARN');
    }
  }

  async quitAndInstall() {
    this.log('Preparing to quit and install update...');
    this.createPreUpdateBackup();
    
    // Give 500ms for backup flush and windows hide
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 500);
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
