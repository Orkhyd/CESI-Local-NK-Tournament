<template>
  <!-- Écran d'attente -->
  <div v-if="isWaiting" class="waiting-screen">
    <div class="waiting-content">
      <img src="../assets/img/scoreboard_nippon_img.png" alt="Nippon Kempo" class="waiting-logo" />
      <h2 class="waiting-text">En attente d'un combat...</h2>
    </div>
  </div>

  <!-- Scoreboard actif -->
  <div v-else class="scoreboard">
    <!-- Lignes des joueurs -->
    <div v-for="p in playersData" :key="p.num" :class="['scoreboard-row', p.colorClass]">
      <div class="row-content">
        <div class="flag">
          <div class="flag-placeholder">
            <div v-if="!flagsLoaded[p.num]" class="spinner"></div>
          </div>
          <img v-show="flagsLoaded[p.num]" @load="onFlagLoad(p.num)" :src="getFlag(p.nationality)"
            :alt="'Drapeau Joueur ' + p.num" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ p.player ? p.player.firstName + ' ' + p.player.lastName : 'En attente' }}
          </div>
          <div class="club-name">{{ p.player?.clubName || '' }}</div>
        </div>
      </div>
      <div class="score-info">
        <div class="ippons">{{ p.ippons }}</div>
        <div :class="['keikokus', p.keikokuClass]">{{ p.keikokus }}</div>
      </div>
    </div>

    <!-- Ligne 3 : fond noir -->
    <div class="scoreboard-row row-black">
      <div class="nippon-img-container">
        <img src="../assets/img/scoreboard_nippon_img.png" alt="Scoreboard Nippon" class="scoreboard-nippon-img" />
      </div>
      <div class="other-content">
        <div class="chrono-display">
          <va-progress-circle :model-value="progressPercent" :indeterminate="match?.timer?.isRunning" color="#ffffff"
            class="timer-progress-circle" :thickness="0.2" />
          <span class="time-text">{{ displayedTime }}</span>
        </div>
        <div class="time-label">
          {{ match?.timer?.currentTime > 0 ? 'Temps réglementaire' : (match?.timer?.additionalTime > -1 ? 'Temps additionnel' : '') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { nationality } from '@/replicache/models/constants';
import { useCountryFlags } from '@/utils/countryFlags';

const match = ref(null);
const player1 = ref(null);
const player2 = ref(null);
const isWaiting = ref(true);
const flagsLoaded = ref({ 1: false, 2: false });
const onFlagLoad = (num) => { flagsLoaded.value[num] = true; };

let updateCleanup;

const { getFlag } = useCountryFlags();

const getCountry = (natId) => nationality.find(c => c.id === Number(natId));

const player1Nationality = computed(() => getCountry(player1.value?.nationalityId));
const player2Nationality = computed(() => getCountry(player2.value?.nationalityId));

const playersData = computed(() => {
  const players = {
    1: { color: 'row-red', player: player1.value, nationality: player1Nationality.value },
    2: { color: 'row-white', player: player2.value, nationality: player2Nationality.value }
  };
  
  return [1, 2].map(num => ({
    num,
    colorClass: players[num].color,
    keikokuClass: `keikokus-player-${num}`,
    player: players[num].player,
    nationality: players[num].nationality,
    ippons: match.value ? match.value[`ipponsPlayer${num}`] : 0,
    keikokus: match.value ? match.value[`keikokusPlayer${num}`] : 0,
  }));
});

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
  if (!match.value?.timer) return '00:00';
  let time = match.value.timer.currentTime;
  if (time === 0 && match.value.timer.additionalTime > -1) {
    time = match.value.timer.additionalTime;
  }
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const handleMatchUpdate = (updateData) => {
  if (!updateData?.data) return;

  const { data } = updateData;

  // Si nouveau match (matchId différent), réinitialiser les drapeaux
  if (match.value && match.value.idMatch !== data.idMatch) {
    flagsLoaded.value = { 1: false, 2: false };
  }

  match.value = data;

  if (data.player1Data) player1.value = data.player1Data;
  if (data.player2Data) player2.value = data.player2Data;

  isWaiting.value = false;
};

const gongSound = new Audio('./finalSound.ogg');

onMounted(async () => {
  if (!window.electron) return;

  // S'abonner aux mises à jour
  updateCleanup = window.electron.onMatchDataUpdate(handleMatchUpdate);

  // Vérifier si un match est déjà sélectionné dans le scoreboard
  const status = await window.electron.getScoreboardStatus();
  if (status?.currentMatchId) {
    const cached = await window.electron.requestMatchData(status.currentMatchId);
    if (cached) {
      handleMatchUpdate({ data: cached });
    }
  }
});

onUnmounted(() => {
  if (updateCleanup) updateCleanup();
});

// Détecter la fin du temps et jouer le gong
watch(
  () => ({
    currentTime: match.value?.timer?.currentTime,
    additionalTime: match.value?.timer?.additionalTime,
  }),
  (newVal, oldVal) => {
    if (oldVal?.currentTime > 0 && newVal.currentTime === 0 &&
        (newVal.additionalTime === undefined || newVal.additionalTime === -1)) {
      gongSound.play().catch(() => {});
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

/* Écran d'attente */
.waiting-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0a0a1a;
}

.waiting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.waiting-logo {
  width: 300px;
  opacity: 0.85;
  animation: pulse 2.5s ease-in-out infinite;
}

.waiting-text {
  color: #ffffff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.5rem, 4vw, 3rem);
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.03); }
}

/* Scoreboard */
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

.row-red { background-color: red; color: black; }
.row-white { background-color: white; color: black; }
.row-black { background-color: black; color: white; }

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

.scoreboard-nippon-img { width: 100%; height: auto; }

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

.time-text { font-family: 'DS-Digital', monospace !important; }

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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.keikokus {
  flex: 0;
  display: flex;
  margin-bottom: 10px;
  justify-content: flex-end;
  font-size: clamp(2rem, 6vw, 10rem);
}

.keikokus-player-1 {
  align-items: flex-end;
}

.keikokus-player-2 {
  align-items: flex-start;
}
</style>
