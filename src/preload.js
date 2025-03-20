const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  openMatchWindow: (matchData) => ipcRenderer.send("open-match-window", matchData),
  openFictiveMatchWindow: () => ipcRenderer.send("open-fictive-match-window"),
});
