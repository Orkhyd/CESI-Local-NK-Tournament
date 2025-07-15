<template>
  <div class="scoreboard">
    <!-- première ligne : Joueur 1, fond rouge -->
    <div class="scoreboard-row row-red">
      <div class="row-content">
        <div class="flag">
          <div class="flag-placeholder">
            <div v-if="!isFlag1Loaded" class="spinner"></div>
          </div>
          <img v-show="isFlag1Loaded" @load="flag1Loaded()" :src="getFlag(player1Nationality)" alt="Drapeau Joueur 1" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player1 ? player1.firstName + ' ' + player1.lastName : "En attente" }}
          </div>
          <div class="club-name">
            {{ player1?.clubName || "Inconnu" }}
          </div>
        </div>
      </div>
      <div class="score-info">
        <div class="ippons">
          {{ match ? match.ipponsPlayer1 : 0 }}
        </div>
        <div class="keikokus-player-1">
          {{ match ? match.keikokusPlayer1 : 0 }}
        </div>
      </div>
    </div>

    <!-- deeuxième ligne : Joueur 2, fond blanc -->
    <div class="scoreboard-row row-white">
      <div class="row-content">
        <div class="flag">
          <div class="flag-placeholder">
            <div v-if="!isFlag2Loaded" class="spinner"></div>
          </div>
          <img v-show="isFlag2Loaded" @load="flag2Loaded()" :src="getFlag(player2Nationality)" alt="Drapeau Joueur 2" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player2 ? player2.firstName + ' ' + player2.lastName : "En attente" }}
          </div>
          <div class="club-name">
            {{ player2?.clubName || "Inconnu" }}
          </div>
        </div>
      </div>
      <div class="score-info">
        <div class="ippons">
          {{ match ? match.ipponsPlayer2 : 0 }}
        </div>
        <div class="keikokus-player-2">
          {{ match ? match.keikokusPlayer2 : 0 }}
        </div>
      </div>
    </div>

    <!-- troiseme ligne : fond noir -->
    <div class="scoreboard-row row-black">
      <div class="nippon-img-container">
        <img src="../assets/img/scoreboard_nippon_img.png" alt="Scoreboard Nippon" class="scoreboard-nippon-img" />
      </div>
      <div class="other-content">
        <!-- chrono avec progress bar -->
        <div class="chrono-display">
          <va-progress-circle :model-value="progressPercent" :indeterminate="match?.timer.isRunning" color="#ffffff"
            class="timer-progress-circle" :thickness="0.2" />
          <span class="time-text">{{ displayedTime }}</span>
        </div>
        <div class="time-label">
          {{ match?.timer.currentTime > 0 ? "Temps réglementaire" : (match?.timer.additionalTime > -1 ? "Temps additionnel" : "") }}
        </div>
      </div>
    </div>

  </div>

</template>

<script setup>
// Script setup pour le scoreboard de match (fenêtre enfant)
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getMatchById } from '@/replicache/stores/matchStore';
import { getParticipantById } from '@/replicache/stores/participantStore';
import { nationality } from '@/replicache/models/constants';
import { replicacheInstance as rep } from '@/replicache/replicache';
import { useCountryFlags } from '@/utils/countryFlags';

const route = useRoute();
const matchId = ref(route.params.id);
const match = ref(null);
const player1 = ref(null);
const player2 = ref(null);
const isFlag1Loaded = ref(false);
const isFlag2Loaded = ref(false);

// Variables pour la communication
let updateCleanup;
let requestInterval;
let heartbeatCleanup;
let unsubscribe;

// === FONCTIONS D'INTERFACE ===

const flag1Loaded = () => {
  isFlag1Loaded.value = true;
}

const flag2Loaded = () => {
  isFlag2Loaded.value = true;
}

// === COMPUTED PROPERTIES ===

const player1Nationality = computed(() => getCountry(player1.value?.nationalityId));
const player2Nationality = computed(() => getCountry(player2.value?.nationalityId));

const progressPercent = computed(() => {
  if (!match.value?.timer) return 0;

  let currentTime = match.value.timer.currentTime;
  let total = 180; // temps réglementaire par défaut

  // Si le temps réglementaire est terminé et que le temps additionnel est actif
  if (currentTime === 0 && match.value.timer.additionalTime > -1) {
    currentTime = match.value.timer.additionalTime;
    total = 60;
  }

  return (currentTime / total) * 100;
});

const displayedTime = computed(() => {
  if (!match.value || !match.value.timer) return "00:00";

  let time = match.value.timer.currentTime;

  // Si le temps réglementaire est à 0 et que le temps additionnel est valide
  if (time === 0 && match.value.timer.additionalTime > -1) {
    time = match.value.timer.additionalTime;
  }

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// === FONCTIONS UTILITAIRES ===

function getCountry(natId) {
  return nationality.find(country => country.id === Number(natId));
}

const { getFlag } = useCountryFlags();

// === SYSTÈME DE COMMUNICATION AVEC LA FENÊTRE PRINCIPALE ===

// Traiter les mises à jour reçues de la fenêtre principale
const handleMatchUpdate = (updateData) => {
  if (!updateData || updateData.matchId !== matchId.value) {
    return;
  }
  
  console.log('📥 Received match update:', updateData);
  
  try {
    const { data, type, timestamp } = updateData;
    
    if (data) {
      // Mettre à jour les données du match
      match.value = {
        ...data,
        timestamp: timestamp || Date.now()
      };
      
      // Mettre à jour les participants si les données sont incluses
      if (data.player1Data) {
        player1.value = data.player1Data;
      }
      
      if (data.player2Data) {
        player2.value = data.player2Data;
      }
      
      console.log(`✅ Match data updated via ${type || 'UPDATE'}:`, {
        ippons1: match.value.ipponsPlayer1,
        ippons2: match.value.ipponsPlayer2,
        timer: match.value.timer?.currentTime,
        timestamp: match.value.timestamp
      });
    }
  } catch (error) {
    console.error('❌ Error processing match update:', error);
  }
};

// Demander les données initiales à la fenêtre principale
const requestInitialData = async () => {
  if (!window.electron?.requestMatchData) {
    console.warn('⚠️ Electron API not available for data request');
    return false;
  }
  
  try {
    console.log('📡 Requesting initial match data for:', matchId.value);
    
    const matchData = await window.electron.requestMatchData(matchId.value);
    
    if (matchData) {
      console.log('📥 Received initial match data:', matchData);
      
      // Traiter les données reçues
      match.value = matchData;
      
      // Charger les participants depuis les données reçues ou depuis la base locale
      if (matchData.player1Data) {
        player1.value = matchData.player1Data;
      } else if (matchData.idPlayer1 && matchData.idPlayer1 !== -1) {
        try {
          player1.value = await getParticipantById(matchData.idPlayer1);
        } catch (error) {
          console.warn('Could not load player1 from local store:', error);
        }
      }
      
      if (matchData.player2Data) {
        player2.value = matchData.player2Data;
      } else if (matchData.idPlayer2 && matchData.idPlayer2 !== -1) {
        try {
          player2.value = await getParticipantById(matchData.idPlayer2);
        } catch (error) {
          console.warn('Could not load player2 from local store:', error);
        }
      }
      
      return true;
    } else {
      console.warn('⚠️ No initial data received from main window');
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting initial data:', error);
    return false;
  }
};

// Démarrer les demandes périodiques de données
const startPeriodicDataRequests = () => {
  if (requestInterval) {
    clearInterval(requestInterval);
  }
  
  console.log('⏰ Starting periodic data requests every 1 second');
  
  requestInterval = setInterval(async () => {
    if (window.electron?.requestMatchData) {
      try {
        const freshData = await window.electron.requestMatchData(matchId.value);
        if (freshData && freshData.timestamp) {
          // Vérifier si les données sont plus récentes
          const currentTimestamp = match.value?.timestamp || 0;
          if (freshData.timestamp > currentTimestamp) {
            handleMatchUpdate({
              matchId: matchId.value,
              data: freshData,
              type: 'PERIODIC_UPDATE',
              timestamp: freshData.timestamp
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Periodic data request failed:', error);
      }
    }
  }, 1000); // Demander toutes les secondes
};

// Arrêter les demandes périodiques
const stopPeriodicDataRequests = () => {
  if (requestInterval) {
    console.log('🛑 Stopping periodic data requests');
    clearInterval(requestInterval);
    requestInterval = null;
  }
};

// Fallback : essayer de charger depuis Replicache local
const tryLocalFallback = async () => {
  console.log('🔄 Trying local Replicache fallback...');
  
  try {
    // Attendre que Replicache soit prêt
    let attempts = 0;
    while ((!rep || !rep.clientID) && attempts < 10) {
      console.log(`⏳ Waiting for Replicache... attempt ${attempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!rep || !rep.clientID) {
      console.warn('⚠️ Replicache not available for fallback');
      return false;
    }
    
    // Essayer de récupérer les données localement
    const localMatch = await getMatchById(matchId.value);
    
    if (localMatch) {
      console.log('✅ Found match data locally:', localMatch);
      match.value = localMatch;
      
      // Charger les participants
      if (localMatch.idPlayer1 && localMatch.idPlayer1 !== -1) {
        player1.value = await getParticipantById(localMatch.idPlayer1);
      }
      if (localMatch.idPlayer2 && localMatch.idPlayer2 !== -1) {
        player2.value = await getParticipantById(localMatch.idPlayer2);
      }
      
      return true;
    } else {
      console.warn('⚠️ Match not found in local Replicache');
      return false;
    }
  } catch (error) {
    console.error('❌ Local fallback failed:', error);
    return false;
  }
};

// === GESTION DU SON ===

const gongSound = new Audio('finalSound.ogg');

// === LIFECYCLE HOOKS ===

onMounted(async () => {
  console.log('🚀 Scoreboard component mounted for match:', matchId.value);
  
  try {
    // === ÉTAPE 1: CONFIGURATION DE LA COMMUNICATION ===
    
    if (window.electron) {
      // S'abonner aux mises à jour de la fenêtre principale
      updateCleanup = window.electron.onMatchDataUpdate(handleMatchUpdate);
      
      // Démarrer le heartbeat si disponible
      if (window.electron.startHeartbeat) {
        window.electron.startHeartbeat(matchId.value, 1000);
        heartbeatCleanup = window.electron.onHeartbeat((data) => {
          if (data.matchId === matchId.value) {
            handleMatchUpdate(data);
          }
        });
      }
      
      console.log('✅ Communication handlers set up');
    }
    
    // === ÉTAPE 2: CHARGEMENT DES DONNÉES INITIALES ===
    
    let dataLoaded = false;
    
    // Essayer de récupérer les données de la fenêtre principale
    if (window.electron) {
      console.log('📡 Trying to get data from main window...');
      dataLoaded = await requestInitialData();
    }
    
    // Si échec, essayer le fallback local
    if (!dataLoaded) {
      console.log('🔄 Main window request failed, trying local fallback...');
      dataLoaded = await tryLocalFallback();
    }
    
    // Si toujours pas de données, attendre un peu puis réessayer
    if (!dataLoaded) {
      console.log('⏳ No data found, waiting and retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (window.electron) {
        dataLoaded = await requestInitialData();
      }
      
      if (!dataLoaded) {
        dataLoaded = await tryLocalFallback();
      }
    }
    
    if (dataLoaded) {
      console.log('✅ Initial data loaded successfully');
      
      // === ÉTAPE 3: DÉMARRER LES MISES À JOUR PÉRIODIQUES ===
      startPeriodicDataRequests();
      
      // === ÉTAPE 4: CONFIGURER LA SUBSCRIPTION REPLICACHE (backup) ===
      if (rep) {
        unsubscribe = rep.subscribe(
          async (tx) => await tx.get(`match/${matchId.value}`),
          (result) => {
            if (result) {
              console.log('📡 Match updated via Replicache subscription');
              // Mettre à jour seulement si pas de timestamp ou timestamp plus ancien
              const currentTimestamp = match.value?.timestamp || 0;
              const resultTimestamp = result.timestamp || 0;
              
              if (resultTimestamp >= currentTimestamp) {
                match.value = { ...result, timestamp: Date.now() };
              }
            }
          }
        );
      }
      
      console.log('✅ Scoreboard setup complete');
    } else {
      console.error('❌ Failed to load initial data from any source');
    }
    
  } catch (error) {
    console.error('❌ Error during scoreboard setup:', error);
  }
});

onUnmounted(() => {
  console.log('🧹 Cleaning up scoreboard component');
  
  // Arrêter les demandes périodiques
  stopPeriodicDataRequests();
  
  // Arrêter le heartbeat
  if (window.electron?.stopHeartbeat) {
    window.electron.stopHeartbeat(matchId.value);
  }
  
  // Nettoyer les handlers de communication
  if (updateCleanup) {
    updateCleanup();
    updateCleanup = null;
  }
  
  if (heartbeatCleanup) {
    heartbeatCleanup();
    heartbeatCleanup = null;
  }
  
  // Nettoyer la subscription Replicache
  if (typeof unsubscribe === 'function') {
    unsubscribe();
    unsubscribe = null;
  }
  
  console.log('✅ Scoreboard cleanup complete');
});

// === WATCHERS ===

// Détecter si les données du match disparaissent
watch(match, (newMatch) => {
  if (!newMatch) {
    console.log('⚠️ Match data disappeared, closing window in 2 seconds...');
    setTimeout(() => {
      if (window.close) {
        window.close();
      }
    }, 2000);
  }
});

// Détecter les changements de participants
watch(match, async (newMatch, oldMatch) => {
  if (!newMatch || !oldMatch) return;

  // Recharger les participants si leurs IDs ont changé
  if (newMatch.idPlayer1 !== oldMatch.idPlayer1) {
    if (newMatch.idPlayer1 && newMatch.idPlayer1 !== -1) {
      try {
        player1.value = await getParticipantById(newMatch.idPlayer1);
      } catch (error) {
        console.warn('Could not reload player1:', error);
      }
    } else {
      player1.value = null;
    }
  }
  
  if (newMatch.idPlayer2 !== oldMatch.idPlayer2) {
    if (newMatch.idPlayer2 && newMatch.idPlayer2 !== -1) {
      try {
        player2.value = await getParticipantById(newMatch.idPlayer2);
      } catch (error) {
        console.warn('Could not reload player2:', error);
      }
    } else {
      player2.value = null;
    }
  }
});

// Watcher pour détecter la fin du temps et jouer le gong
watch(
  () => ({
    currentTime: match.value?.timer?.currentTime,
    additionalTime: match.value?.timer?.additionalTime,
  }),
  (newVal, oldVal) => {
    if (
      oldVal?.currentTime > 0 &&
      newVal.currentTime === 0 &&
      (newVal.additionalTime === undefined || newVal.additionalTime === -1)
    ) {
      console.log('🔔 Time is up! Playing gong sound...');
      gongSound.play().catch((err) => {
        console.error('❌ Error playing gong sound:', err);
      });
    }
  }
);
</script>

<style scoped>

@font-face {
    font-family: 'Bebas Neue';
    src: url('/fonts/BebasNeue-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
  font-family: 'DS-Digital';
  src: url('/fonts/DS-Digital.woff2') format('woff2'),
       url('/fonts/DS-Digital.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* scoreboard prend toute la hauteur de l'écran */
.scoreboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
}

/* chaque ligne prend exactement 1/3 de la hauteur */
.scoreboard-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1 1 0;
  min-height: 0;
  padding: 10px;
}

/* couleurs de fond */
.row-red {
  background-color: red;
  color: black;
}

.row-white {
  background-color: white;
  color: black;
}

.row-black {
  background-color: black;
  color: white;
}

.scoreboard-row.row-black {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nippon-img-container {
  flex: 0 0 33.33%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scoreboard-nippon-img {
  width: 100%;
  height: auto;
}

.other-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 10px;
}

.time-label {
  font-size: clamp(1.2rem, 3vw, 4rem);
  font-weight: bold;
  color: white;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 5px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.chrono-display {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: clamp(1rem, 12vw, 20rem);
  font-weight: bold;
  color: white;
  padding-right: 20px;
}

.time-text {
    font-family: 'DS-Digital', monospace !important;
}

.timer-progress-circle {
  width: clamp(1rem, 10vw, 15rem) !important;
  height: clamp(1rem, 10vw, 20rem) !important;
}

.row-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 5;
}
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(66, 133, 244, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.flag img {
  width: 20vw;
  max-width: 200px;
  height: auto;
  border-radius: 20px;
  margin-right: 30px;
  margin-left: 20px;
  border: 1.5px solid black;
}

.flag-placeholder {
  width: 20vw;
  max-width: 200px;
  height: auto;
  border-radius: 20px;
  margin-right: 30px;
  margin-left: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.player-name {
  font-size: clamp(1.5rem, 5vw, 7rem);
  font-weight: bold;
  font-family: 'Bebas Neue', sans-serif;
}

.club-name {
  font-size: clamp(1rem, 3vw, 5rem);
  font-family: 'Bebas Neue', sans-serif;
}

.score-info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  width: 100%;
  flex: 1;
  margin-right: 50px;
}

.ippons {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(5rem, 15vw, 30rem);
  font-weight: bold;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
}

.keikokus-player-1 {
  flex: 0;
  display: flex;
  align-items: flex-end;
  margin-bottom: 10px;
  justify-content: flex-end;
  font-size: clamp(2rem, 6vw, 10rem);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
}

.keikokus-player-2 {
  flex: 0;
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  justify-content: flex-end;
  font-size: clamp(2rem, 6vw, 10rem);
}

</style>
