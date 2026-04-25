<template>
  <!-- ecran d attente si aucun combat n est actif -->
  <div v-if="isWaiting" class="waiting-screen">
    <img src="../assets/img/scoreboard_nippon_img.png" alt="Nippon Kempo" class="waiting-logo" />
    <p class="waiting-text">En attente d'un combat...</p>
  </div>

  <!-- scoreboard actif -->
  <div v-else class="scoreboard">
    <!-- premiere ligne : Joueur 1, fond rouge -->
    <div class="scoreboard-row row-red">
      <div class="row-content">
        <div class="flag">
          <div class="flag-placeholder">
            <div v-if="!isFlag1Loaded" class="spinner"></div>
          </div>
          <img v-show="isFlag1Loaded" @load="isFlag1Loaded = true" :src="getFlag(player1Nationality)" alt="Drapeau Joueur 1" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player1 ? player1.firstName + ' ' + player1.lastName : "En attente" }}
          </div>
          <div class="club-name">
            {{ player1?.clubName || "" }}
          </div>
        </div>
      </div>
      <div class="score-info">
        <div class="ippons">{{ match ? match.ipponsPlayer1 : 0 }}</div>
        <div class="keikokus-player-1">{{ match ? match.keikokusPlayer1 : 0 }}</div>
      </div>
    </div>

    <!-- deuxieme ligne : Joueur 2, fond blanc -->
    <div class="scoreboard-row row-white">
      <div class="row-content">
        <div class="flag">
          <div class="flag-placeholder">
            <div v-if="!isFlag2Loaded" class="spinner"></div>
          </div>
          <img v-show="isFlag2Loaded" @load="isFlag2Loaded = true" :src="getFlag(player2Nationality)" alt="Drapeau Joueur 2" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player2 ? player2.firstName + ' ' + player2.lastName : "En attente" }}
          </div>
          <div class="club-name">
            {{ player2?.clubName || "" }}
          </div>
        </div>
      </div>
      <div class="score-info">
        <div class="ippons">{{ match ? match.ipponsPlayer2 : 0 }}</div>
        <div class="keikokus-player-2">{{ match ? match.keikokusPlayer2 : 0 }}</div>
      </div>
    </div>

    <!-- troisieme ligne : fond noir -->
    <div class="scoreboard-row row-black">
      <div class="nippon-img-container">
        <img src="../assets/img/scoreboard_nippon_img.png" alt="Scoreboard Nippon" class="scoreboard-nippon-img" />
      </div>
      <div class="other-content">
        <div class="chrono-display">
          <va-progress-circle
            :model-value="progressPercent"
            :indeterminate="match?.timer?.isRunning"
            color="#ffffff"
            class="timer-progress-circle"
            :thickness="0.2"
          />
          <span class="time-text">{{ displayedTime }}</span>
        </div>
        <div class="time-label">
          {{ match?.timer?.currentTime > 0
            ? "Temps reglementaire"
            : (match?.timer?.additionalTime > -1 ? "Temps additionnel" : "") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { nationality } from '@/replicache/models/constants';
import { useCountryFlags } from '@/utils/countryFlags';

const { getFlag } = useCountryFlags();

const match = ref(null);
const player1 = ref(null);
const player2 = ref(null);
const isWaiting = ref(true);
const isFlag1Loaded = ref(false);
const isFlag2Loaded = ref(false);

let updateCleanup = null;

const gongSound = new Audio('finalSound.ogg');

// ===  MISE A JOUR DEPUIS LA FENETRE PRINCIPALE ===

const handleMatchUpdate = (updateData) => {
  if (!updateData || !updateData.data) return;

  const { data, timestamp } = updateData;

  // si le match change, reinitialiser les drapeaux
  if (match.value?.idMatch && match.value.idMatch !== data.idMatch) {
    isFlag1Loaded.value = false;
    isFlag2Loaded.value = false;
  }

  match.value = { ...data, timestamp: timestamp || Date.now() };

  if (data.player1Data) player1.value = data.player1Data;
  if (data.player2Data) player2.value = data.player2Data;

  isWaiting.value = false;
};

// === COMPUTED ===

const getCountry = (natId) => nationality.find(c => c.id === Number(natId));
const player1Nationality = computed(() => getCountry(player1.value?.nationalityId));
const player2Nationality = computed(() => getCountry(player2.value?.nationalityId));

const progressPercent = computed(() => {
  if (!match.value?.timer) return 0;
  let currentTime = match.value.timer.currentTime;
  let total = 180;
  if (currentTime === 0 && match.value.timer.additionalTime > -1) {
    currentTime = match.value.timer.additionalTime;
    total = 60;
  }
  return (currentTime / total) * 100;
});

const displayedTime = computed(() => {
  if (!match.value?.timer) return "0:00";
  let time = match.value.timer.currentTime;
  if (time === 0 && match.value.timer.additionalTime > -1) {
    time = match.value.timer.additionalTime;
  }
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// === GONG ===

watch(
  () => ({ currentTime: match.value?.timer?.currentTime, additionalTime: match.value?.timer?.additionalTime }),
  (newVal, oldVal) => {
    if (
      oldVal?.currentTime > 0 &&
      newVal.currentTime === 0 &&
      (newVal.additionalTime === undefined || newVal.additionalTime === -1)
    ) {
      gongSound.play().catch(() => {});
    }
  }
);

// === LIFECYCLE ===

onMounted(() => {
  if (window.electron) {
    updateCleanup = window.electron.onMatchDataUpdate(handleMatchUpdate);
  }
});

onUnmounted(() => {
  if (updateCleanup) {
    updateCleanup();
    updateCleanup = null;
  }
});
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

/* ecran d attente */
.waiting-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0c2432;
  gap: 40px;
}

.waiting-logo {
  width: 40vw;
  max-width: 500px;
  opacity: 0.85;
}

.waiting-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.5rem, 4vw, 4rem);
  color: #ffffff;
  letter-spacing: 3px;
  text-transform: uppercase;
}

/* scoreboard */
.scoreboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
}

.scoreboard-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1 1 0;
  min-height: 0;
  padding: 10px;
}

.row-red   { background-color: red;   color: black; }
.row-white { background-color: white; color: black; }
.row-black { background-color: black; color: white; display: flex; align-items: center; justify-content: flex-start; }

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
  text-transform: uppercase;
  letter-spacing: 1px;
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
}

.keikokus-player-1 {
  flex: 0;
  display: flex;
  align-items: flex-end;
  margin-bottom: 10px;
  justify-content: flex-end;
  font-size: clamp(2rem, 6vw, 10rem);
}

.keikokus-player-2 {
  flex: 0;
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  justify-content: flex-end;
  font-size: clamp(2rem, 6vw, 10rem);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(66, 133, 244, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
