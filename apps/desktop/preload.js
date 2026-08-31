const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  printDocument: (url, printOptions) => ipcRenderer.invoke('print-document', { url, printOptions }),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
