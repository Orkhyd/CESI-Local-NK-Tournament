const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

console.log("✅ electron Main Process démarré !");

let openWindows = {}; // stocke les fenêtres ouvertes

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

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

  // verif si la fenêtre est déjà ouverte
  if (openWindows[matchId] && !openWindows[matchId].isDestroyed()) {
    openWindows[matchId].focus(); // 🔥 Ramène la fenêtre au premier plan
    return;
  }

  const matchWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  matchWindow.loadURL(`http://localhost:5173/match/${matchId}`);

  // stocke la feneetre ouverte
  openWindows[matchId] = matchWindow;

  // supp l'entrée quand la fenêtre est fermée
  matchWindow.on("closed", () => {
    delete openWindows[matchId];
  });
});

ipcMain.on("open-fictive-match-window", () => {
  const fictiveMatchId = "fictive-mode";

  // ferme les fenêtres existantes si elles sont ouvertes
  if (openWindows[fictiveMatchId]) {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.close();
    });
    openWindows = {};
  }

  // recup les dimensions de l'écran
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;

  // creer la fenêtre de contrôle
  const controlWindow = new BrowserWindow({
    width: 800,
    height: 700,
    x: 0,
    y: Math.floor((height - 600) / 2),
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.js"),
      contextIsolation: true
    }
  });

  // creer la fenêtre d'affichage
  const displayWindow = new BrowserWindow({
    width: 800,
    height: 550,
    x: width - 800,
    y: Math.floor((height - 550) / 2),
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.js"),
      contextIsolation: true
    }
  });

  // charge les URLs
  controlWindow.loadURL('http://localhost:5173/fictive-control');
  displayWindow.loadURL('http://localhost:5173/fictive-display');

  // stocke les références
  openWindows[fictiveMatchId] = { controlWindow, displayWindow };

  // gestion de fermeture
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

