const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onGenerateCode: (callback) => ipcRenderer.on('generate-code', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// DOM Content Loaded listener
window.addEventListener('DOMContentLoaded', () => {
  console.log('Random Code Generator App Loaded');
});
