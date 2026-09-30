const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  printDocument: (url, printOptions) => ipcRenderer.invoke('print-document', { url, printOptions }),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  exitApp: () => ipcRenderer.send('app-exit'),
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

