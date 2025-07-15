const { app, BrowserWindow, ipcMain } = require('electron');
const { started } = require("electron-squirrel-startup");
const { updateElectronApp } = require('update-electron-app');
const path = require('path');

// Auto-update
updateElectronApp({
  repo: 'Orkhyd/CESI-Local-NK-Tournament',
  updateInterval: '1 hour',
  logger: console,
  notifyUser: true,
});

// Handle Squirrel error
if (started) {
  app.quit();
  process.exit(0);
}

console.log("✅ Electron Main Process démarré !");

const isDev = !app.isPackaged;
let openWindows = {};

const getPreloadPath = () => path.join(__dirname, 'preload.js');
const getDistPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app', 'dist', 'index.html');
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

app.whenReady().then(() => {
  const { screen } = require('electron');

  createWindow();

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
      matchWindow.loadFile(getDistPath());
      // Puis naviguez vers la route après le chargement
      matchWindow.webContents.once('did-finish-load', () => {
        matchWindow.webContents.executeJavaScript(`
          window.location.hash = '/match/${matchId}';
        `);
      });
    }

    openWindows[matchId] = matchWindow;
    matchWindow.on('closed', () => delete openWindows[matchId]);
  });

  ipcMain.on('open-fictive-match-window', () => {
    const fictiveMatchId = 'fictive-mode';

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

  ipcMain.on('close-fictive-windows', () => {
    const id = 'fictive-mode';
    if (!openWindows[id]) return;
    const { controlWindow, displayWindow } = openWindows[id];
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.close();
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
    delete openWindows[id];
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
