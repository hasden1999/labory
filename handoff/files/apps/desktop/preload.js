const { contextBridge, ipcRenderer } = require('electron');

try {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  fs.appendFileSync(path.join(os.tmpdir(), 'labryo-preload.log'), `[${new Date().toISOString()}] Preload running on: ${window.location.href}\n`);
} catch (e) {}

contextBridge.exposeInMainWorld('electronDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  printDocument: (url, printOptions) => ipcRenderer.invoke('print-document', { url, printOptions }),
  generateReportImage: (params) => ipcRenderer.invoke('report:generate-image', params),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  exitApp: () => ipcRenderer.send('app-exit'),
  retryServer: () => ipcRenderer.send('server:retry-now'),
  readClipboardText: () => ipcRenderer.invoke('clipboard:read-text'),
  writeClipboardImage: (base64Data) => ipcRenderer.invoke('clipboard:write-image', { base64Data }),
  shareToWhatsApp: (params) => ipcRenderer.invoke('whatsapp:share-direct', params),
  updater: {
    getState: () => ipcRenderer.invoke('updater:get-state'),
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
    getChannel: () => ipcRenderer.invoke('updater:get-channel'),
    setChannel: (channel) => ipcRenderer.invoke('updater:set-channel', channel),
    onStateChange: (callback) => {
      const listener = (_event, state) => callback(state);
      ipcRenderer.on('updater:state-changed', listener);
      return () => ipcRenderer.removeListener('updater:state-changed', listener);
    },
  },
});

