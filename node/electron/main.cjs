/* main.cjs */

// 1) Require core Electron APIs and other modules, _before_ any event logic
const { app, BrowserWindow, ipcMain } = require('electron');
const { started } = require("electron-squirrel-startup");
const { updateElectronApp } = require('update-electron-app');
const path = require('path');

// Auto-update (production only)
updateElectronApp({
  repo: 'Orkhyd/CESI-Local-NK-Tournament',
  updateInterval: '1 hour',
  logger: console,
  notifyUser: true,
});


// 2) Handle Windows Squirrel install/uninstall events early
if (started) {
  app.quit();
  process.exit(0);
}

console.log("✅ Electron Main Process démarré !");

// 3) Environment & State
const isDev = !app.isPackaged;
let openWindows = {};

// 4) Helpers
const getPreloadPath = () => path.join(__dirname, 'preload.js');
const getDistPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dist', 'index.html');
  }
  return path.join(__dirname, '../dist/index.html');
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });
  win.removeMenu();

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(getDistPath());
  }
}

// 5) When the app is ready, it's safe to use screen and updater
app.whenReady().then(() => {
  // Require 'screen' after app is initialized
  const { screen } = require('electron');

  // Dynamically require the updater _only_ after app is ready
  createWindow();

  // -- IPC: Open a match window --
  ipcMain.on('open-match-window', (event, matchData) => {
    const matchId = matchData.idMatch;
    if (openWindows[matchId] && !openWindows[matchId].isDestroyed()) {
      openWindows[matchId].focus();
      return;
    }

    const matchWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
      },
    });

    if (isDev) {
      matchWindow.loadURL(`http://localhost:5173/#/match/${matchId}`);
    } else {
      matchWindow.loadFile(getDistPath(), { hash: `/match/${matchId}` });
    }

    openWindows[matchId] = matchWindow;
    matchWindow.on('closed', () => delete openWindows[matchId]);
  });

  // -- IPC: Open dual fictive-match windows --
  ipcMain.on('open-fictive-match-window', () => {
    const fictiveMatchId = 'fictive-mode';

    // Close existing
    if (openWindows[fictiveMatchId]) {
      BrowserWindow.getAllWindows().forEach(win => { if (!win.isDestroyed()) win.close(); });
      openWindows = {};
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const controlWindow = new BrowserWindow({
      width: 800, height: 700,
      x: 0, y: Math.floor((height - 600) / 2),
      webPreferences: { preload: getPreloadPath(), contextIsolation: true }
    });
    const displayWindow = new BrowserWindow({
      width: 800, height: 550,
      x: width - 800, y: Math.floor((height - 550) / 2),
      webPreferences: { preload: getPreloadPath(), contextIsolation: true }
    });

    if (isDev) {
      controlWindow.loadURL('http://localhost:5173/#/fictive-control');
      displayWindow.loadURL('http://localhost:5173/#/fictive-display');
    } else {
      const distPath = getDistPath();
      controlWindow.loadFile(distPath, { hash: '/fictive-control' });
      displayWindow.loadFile(distPath, { hash: '/fictive-display' });
    }

    openWindows[fictiveMatchId] = { controlWindow, displayWindow };

    const closeAll = () => {
      if (controlWindow && !controlWindow.isDestroyed()) controlWindow.close();
      if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
      delete openWindows[fictiveMatchId];
    };
    controlWindow.on('closed', closeAll);
    displayWindow.on('closed', closeAll);
  });

  // -- IPC: Close fictive windows --
  ipcMain.on('close-fictive-windows', () => {
    const id = 'fictive-mode';
    if (!openWindows[id]) return;
    const { controlWindow, displayWindow } = openWindows[id];
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.close();
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
    delete openWindows[id];
  });
});

// 6) Standard window-all-closed and activate handlers
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
