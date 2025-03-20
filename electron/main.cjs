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
  const fictiveMatchId = "fictive-mode"; // id unique fictif

  // verif si une fenêtre fictive est déjà ouverte
  if (openWindows[fictiveMatchId] && !openWindows[fictiveMatchId].isDestroyed()) {
    openWindows[fictiveMatchId].focus(); // ramene la fenêtre fictive au premier plan
    return;
  }

  const fictiveMatchWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  fictiveMatchWindow.loadURL(`http://localhost:5173/match/fictive`);

  // stocke la fenêtre fictive
  openWindows[fictiveMatchId] = fictiveMatchWindow;

  // supp l'entrée quand la fenêtre est fermée
  fictiveMatchWindow.on("closed", () => {
    delete openWindows[fictiveMatchId];
  });
});

