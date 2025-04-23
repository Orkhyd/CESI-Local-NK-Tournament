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

const flag1Loaded = () => {
  isFlag1Loaded.value = true;
}

const flag2Loaded = () => {
  isFlag2Loaded.value = true;
}

const player1Nationality = computed(() => getCountry(player1.value?.nationalityId));
const player2Nationality = computed(() => getCountry(player2.value?.nationalityId));

const progressPercent = computed(() => {
  if (!match.value?.timer) return 0;

  let currentTime = match.value.timer.currentTime;
  let total = 180; // tps réglementaire par défaut

  // si le temps réglementaire est terminé et que le temps additionnel est actif
  if (currentTime === 0 && match.value.timer.additionalTime > -1) {
    currentTime = match.value.timer.additionalTime;
    total = 60;
  }

  return (currentTime / total) * 100;
});


let unsubscribe;

onMounted(async () => {
  // recup le match par son ID
  match.value = await getMatchById(matchId.value);

  // recup les participants du match
  if (match.value.idPlayer1 && match.value.idPlayer1 !== -1) {
    player1.value = await getParticipantById(match.value.idPlayer1);
  }
  if (match.value.idPlayer2 && match.value.idPlayer2 !== -1) {
    player2.value = await getParticipantById(match.value.idPlayer2);
  }
  unsubscribe = rep.subscribe(
    async (tx) => await tx.get(`match/${matchId.value}`),
    (result) => {
      if (result) {
        match.value = result;
      }
    }
  );
});

onUnmounted(() => {
  if (typeof unsubscribe === 'function') {
    unsubscribe();
  }
});

// deetecte si les données du match disparaissent
watch(match, (newMatch) => {
  if (!newMatch) {
    setTimeout(() => {
      window.close()
    }, 2000);
  }
});

// watch pour détecter les IPPON / KEIKOKU et les infos du match
watch(match, async (newMatch, oldMatch) => {
  if (!newMatch || !oldMatch) return;

  if (newMatch.idPlayer1 && newMatch.idPlayer1 !== -1) {
    player1.value = await getParticipantById(newMatch.idPlayer1);
  }
  if (newMatch.idPlayer2 && newMatch.idPlayer2 !== -1) {
    player2.value = await getParticipantById(newMatch.idPlayer2);
  }

});

function getCountry(natId) {
  return nationality.find(country => country.id === Number(natId));
}

const { getFlag } = useCountryFlags();


const displayedTime = computed(() => {
  if (!match.value || !match.value.timer) return "00:00";

  let time = match.value.timer.currentTime;

  // si le tps réglementaire est à 0 et que le temps additionnel est valide
  if (time === 0 && match.value.timer.additionalTime > -1) {
    time = match.value.timer.additionalTime;
  }

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
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
