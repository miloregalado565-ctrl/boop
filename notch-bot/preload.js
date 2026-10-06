const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notch', {
  expand:   () => ipcRenderer.send('expand'),
  collapse: () => ipcRenderer.send('collapse'),
  quit:     () => ipcRenderer.send('quit'),
});
