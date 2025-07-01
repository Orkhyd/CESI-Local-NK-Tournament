if (require('electron-squirrel-startup')) {
  app.quit();
}

const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const { updateElectronApp } = require('update-electron-app');

console.log("✅ electron Main Process démarré !");

// Determine if we're in development or production
const isDev = !app.isPackaged;

let openWindows = {}; // stocke les fenêtres ouvertes

// Get correct preload path based on environment
const getPreloadPath = () => {
  if (isDev) {
    // In dev, preload should be in node/src/preload/
    return path.join(__dirname, "preload.js");
  } else {
    // In production, preload will be in the same directory as main
    return path.join(__dirname, "preload.js");
  }
};

const getDistPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dist', 'index.html');
  } else {
    // In dev with node structure, dist will be in node/dist/
    return path.join(__dirname, '../dist/index.html');
  }
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

  // Load the correct URL based on environment
  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(getDistPath());
  }
}

app.whenReady().then(() => {
  createWindow();

  // Auto-updater setup - only in production and after app is ready
  if (!isDev) {
    updateElectronApp({
      repo: 'Orkhyd/CESI-Local-NK-Tournament',
      updateInterval: '1 hour',
      logger: console,
      notifyUser: true, // Show update notifications to users
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ouvrir une fenetre de scorebaord pour un match
ipcMain.on("open-match-window", (event, matchData) => {
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

  matchWindow.on("closed", () => {
    delete openWindows[matchId];
  });
});

ipcMain.on("open-fictive-match-window", () => {
  const fictiveMatchId = "fictive-mode";

  if (openWindows[fictiveMatchId]) {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.close();
    });
    openWindows = {};
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const controlWindow = new BrowserWindow({
    width: 800,
    height: 700,
    x: 0,
    y: Math.floor((height - 600) / 2),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true
    }
  });

  const displayWindow = new BrowserWindow({
    width: 800,
    height: 550,
    x: width - 800,
    y: Math.floor((height - 550) / 2),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true
    }
  });

  if (isDev) {
    // ✅ THIS IS THE FIX: Add '/#' to the URL for hash-based routing
    controlWindow.loadURL('http://localhost:5173/#/fictive-control');
    displayWindow.loadURL('http://localhost:5173/#/fictive-display');
  } else {
    // This part is correct for production
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

ipcMain.on("close-fictive-windows", () => {
  const fictiveMatchId = "fictive-mode";
  if (openWindows[fictiveMatchId]) {
    const { controlWindow, displayWindow } = openWindows[fictiveMatchId];
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.close();
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
    delete openWindows[fictiveMatchId];
  }
});
