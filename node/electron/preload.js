const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // === MÉTHODES ORIGINALES ===
  openMatchWindow: (matchData) => ipcRenderer.send("open-match-window", matchData),
  openFictiveMatchWindow: () => ipcRenderer.send("open-fictive-match-window"),
  closeFictiveWindows: () => ipcRenderer.send("close-fictive-windows"),
  
  // === SYSTÈME DE COMMUNICATION MATCH DATA ===
  
  // Pour la fenêtre principale (modale) - Envoyer des données aux fenêtres enfants
  broadcastMatchUpdate: (matchData) => {
    ipcRenderer.send('broadcast-match-update', matchData);
  },
  
  // Pour les fenêtres enfants (scoreboard) - Demander des données à la fenêtre principale
  requestMatchData: (matchId) => {
    return ipcRenderer.invoke('request-match-data', matchId);
  },
  
  // Pour les fenêtres enfants - S'abonner aux mises à jour automatiques
  onMatchDataUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('match-data-update', handler);
    
    // Retourner une fonction de nettoyage
    return () => ipcRenderer.removeListener('match-data-update', handler);
  },
  
  // Pour la fenêtre principale - Répondre aux demandes de données
  onMatchDataRequest: (callback) => {
    const handler = (event, matchId) => callback(matchId);
    ipcRenderer.on('match-data-request', handler);
    
    return () => ipcRenderer.removeListener('match-data-request', handler);
  },
  
  // Pour la fenêtre principale - Envoyer une réponse aux demandes
  sendMatchDataResponse: (matchId, matchData) => {
    ipcRenderer.send('match-data-response', { matchId, data: matchData });
  },
  
  // === COMMUNICATION DIRECTE ENTRE FENÊTRES (style fictif) ===
  
  // PostMessage API pour communication directe parent/enfant
  sendToParent: (message) => {
    if (window.opener) {
      window.opener.postMessage(message, '*');
    }
  },
  
  sendToChild: (windowRef, message) => {
    if (windowRef && !windowRef.closed) {
      windowRef.postMessage(message, '*');
    }
  },
  
  onMessage: (callback) => {
    const handler = (event) => callback(event.data);
    window.addEventListener('message', handler);
    
    return () => window.removeEventListener('message', handler);
  },
  
  // === UTILITAIRES ===
  
  // Logs pour debug
  log: (level, message, data) => {
    ipcRenderer.send('log-from-renderer', level, message, data);
  },
  
  // Informations sur la fenêtre
  getWindowInfo: () => {
    return ipcRenderer.invoke('get-window-info');
  },
  
  // Nettoyer tous les listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // === HEARTBEAT SYSTEM ===
  
  // Pour maintenir la connexion vivante entre fenêtres
  startHeartbeat: (matchId, interval = 1000) => {
    return ipcRenderer.invoke('start-heartbeat', matchId, interval);
  },
  
  stopHeartbeat: (matchId) => {
    ipcRenderer.send('stop-heartbeat', matchId);
  },
  
  onHeartbeat: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('heartbeat', handler);
    
    return () => ipcRenderer.removeListener('heartbeat', handler);
  }
});