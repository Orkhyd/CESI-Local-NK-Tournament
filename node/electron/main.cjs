const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { started } = require("electron-squirrel-startup");
const { updateElectronApp } = require('update-electron-app');
const path = require('path');

// === CONFIGURATION ===
const isDev = !app.isPackaged;
const SHARED_PARTITION = `persist:main-${process.pid}`;

// === VARIABLES GLOBALES ===
let mainWindow = null;
let openWindows = {};
let heartbeatIntervals = new Map();

// === AUTO-UPDATE ===
updateElectronApp({
  repo: 'Orkhyd/CESI-Local-NK-Tournament',
  updateInterval: '1 hour',
  logger: console,
  notifyUser: true,
});

// Handle Squirrel
if (started) {
  app.quit();
  process.exit(0);
}

// === UTILITAIRES ===
const getPreloadPath = () => path.join(__dirname, 'preload.js');
const getDistPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dist', 'index.html');
  }
  return path.join(__dirname, '../dist/index.html');
};

// === CRÉATION DE LA FENÊTRE PRINCIPALE ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      partition: SHARED_PARTITION,
    },
  });



  // Charger l'application
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(getDistPath());
    mainWindow.removeMenu();
  }

  // Gérer la fermeture
  mainWindow.on('closed', () => {
    cleanup();
  });
}

// === NETTOYAGE ===
function cleanup() {
  mainWindow = null;

  // Nettoyer heartbeats
  heartbeatIntervals.forEach((interval) => clearInterval(interval));
  heartbeatIntervals.clear();

  // Fermer toutes les fenêtres
  Object.values(openWindows).forEach(window => {
    try {
      if (window?.controlWindow && !window.controlWindow.isDestroyed()) {
        window.controlWindow.close();
      }
      if (window?.displayWindow && !window.displayWindow.isDestroyed()) {
        window.displayWindow.close();
      }
      if (window && !window.isDestroyed?.()) {
        window.close();
      }
    } catch (error) {
      console.warn('⚠️ Error closing window:', error);
    }
  });

  openWindows = {};
}

// === GESTIONNAIRE D'ÉVÉNEMENTS IPC ===
function setupIpcHandlers() {
  // Ouvrir fenêtre de match
  ipcMain.on('open-match-window', (event, matchData) => {
    createMatchWindow(matchData);
  });

  // Ouvrir fenêtres fictives
  ipcMain.on('open-fictive-match-window', () => {
    createFictiveWindows();
  });

  // Fermer fenêtres fictives
  ipcMain.on('close-fictive-windows', () => {
    closeFictiveWindows();
  });

  // Communication match data
  ipcMain.on('broadcast-match-update', (event, matchData) => {
    broadcastMatchUpdate(matchData);
  });

  ipcMain.handle('request-match-data', async (event, matchId) => {
    return await requestMatchData(matchId);
  });

  ipcMain.on('match-data-response', () => {
    // Géré par le Promise dans requestMatchData
  });

  // Heartbeat
  ipcMain.handle('start-heartbeat', (event, matchId, interval = 1000) => {
    return startHeartbeat(matchId, interval);
  });

  ipcMain.on('stop-heartbeat', (event, matchId) => {
    stopHeartbeat(matchId);
  });


  ipcMain.handle('get-window-info', () => ({
    partition: SHARED_PARTITION,
    pid: process.pid,
    openWindows: Object.keys(openWindows),
    heartbeats: Array.from(heartbeatIntervals.keys())
  }));
}

// === CRÉATION FENÊTRE DE MATCH ===
function createMatchWindow(matchData) {
  const matchId = matchData.idMatch;

  if (openWindows[matchId] && !openWindows[matchId].isDestroyed()) {
    openWindows[matchId].focus();
    return;
  }

  const matchWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      partition: SHARED_PARTITION,
    },
  });

  if (isDev) {
    matchWindow.loadURL(`http://localhost:5173/#/match/${matchId}`);
  } else {
    matchWindow.loadFile(getDistPath(), { hash: `/match/${matchId}` });
    mainWindow.removeMenu();
  }

  openWindows[matchId] = matchWindow;

  matchWindow.on('closed', () => {
    delete openWindows[matchId];
    stopHeartbeat(matchId);
  });

  matchWindow.webContents.once('dom-ready', () => {
    setTimeout(() => {
      matchWindow.webContents.send('match-data-update', {
        matchId: matchId,
        data: matchData,
        type: 'INITIAL_DATA'
      });
    }, 1000);
  });
}

// === CRÉATION FENÊTRES FICTIVES ===
function createFictiveWindows() {
  const fictiveMatchId = 'fictive-mode';

  if (openWindows[fictiveMatchId]) {
    closeFictiveWindows();
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const controlWindow = new BrowserWindow({
    width: 800,
    height: 700,
    x: 0,
    y: Math.floor((height - 600) / 2),
    parent: mainWindow,
    modal: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      partition: SHARED_PARTITION
    }
  });

  const displayWindow = new BrowserWindow({
    width: 800,
    height: 550,
    x: width - 800,
    y: Math.floor((height - 550) / 2),
    parent: mainWindow,
    modal: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      partition: SHARED_PARTITION
    }
  });

  if (isDev) {
    controlWindow.loadURL('http://localhost:5173/#/fictive-control');
    displayWindow.loadURL('http://localhost:5173/#/fictive-display');
  } else {
    controlWindow.loadFile(getDistPath(), { hash: '/fictive-control' });
    displayWindow.loadFile(getDistPath(), { hash: '/fictive-display' });
    controlWindow.removeMenu();
    displayWindow.removeMenu();
  }

  openWindows[fictiveMatchId] = { controlWindow, displayWindow };

  const closeAll = () => {
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.close();
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
    delete openWindows[fictiveMatchId];
  };

  controlWindow.on('closed', closeAll);
  displayWindow.on('closed', closeAll);
}

// === FERMETURE FENÊTRES FICTIVES ===
function closeFictiveWindows() {
  const fictiveWindows = openWindows['fictive-mode'];
  if (!fictiveWindows) return;

  const { controlWindow, displayWindow } = fictiveWindows;

  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.close();
  }

  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.close();
  }

  delete openWindows['fictive-mode'];
}

// === COMMUNICATION MATCH DATA ===
function broadcastMatchUpdate(matchData) {
  const matchId = matchData.idMatch;

  // Envoyer à la fenêtre de match
  if (openWindows[matchId] && !openWindows[matchId].isDestroyed()) {
    openWindows[matchId].webContents.send('match-data-update', {
      matchId: matchId,
      data: matchData,
      type: 'UPDATE',
      timestamp: Date.now()
    });
  }

  // Envoyer aux fenêtres fictives
  const fictiveWindows = openWindows['fictive-mode'];
  if (fictiveWindows) {
    [fictiveWindows.controlWindow, fictiveWindows.displayWindow].forEach(window => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('match-data-update', {
          matchId: matchId,
          data: matchData,
          type: 'UPDATE',
          timestamp: Date.now()
        });
      }
    });
  }
}

async function requestMatchData(matchId) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000);

    const responseHandler = (event, response) => {
      if (response.matchId === matchId) {
        clearTimeout(timeout);
        ipcMain.removeListener('match-data-response', responseHandler);
        resolve(response.data);
      }
    };

    ipcMain.on('match-data-response', responseHandler);
    mainWindow.webContents.send('match-data-request', matchId);
  });
}

// === HEARTBEAT ===
function startHeartbeat(matchId, interval = 1000) {
  if (heartbeatIntervals.has(matchId)) {
    clearInterval(heartbeatIntervals.get(matchId));
  }

  const heartbeatInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('heartbeat-request', matchId);
    }
  }, interval);

  heartbeatIntervals.set(matchId, heartbeatInterval);
  return true;
}

function stopHeartbeat(matchId) {
  if (heartbeatIntervals.has(matchId)) {
    clearInterval(heartbeatIntervals.get(matchId));
    heartbeatIntervals.delete(matchId);
  }
}

// === INITIALISATION ===
app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

// === GESTION APPLICATION ===
app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// === GESTION ERREURS ===
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
