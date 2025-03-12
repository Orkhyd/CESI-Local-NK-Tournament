<template>
  <div class="scoreboard">
    <!-- première ligne : Joueur 1, fond rouge -->
    <div class="scoreboard-row row-red">
      <div class="row-content">
        <div class="flag">
          <img :src="getFlagUrl(player1Nationality?.flag)" alt="Drapeau Joueur 1" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player1 ? player1.firstName + ' ' + player1.lastName : "En attente" }}
            <span v-if="match?.idWinner === match?.idPlayer1" class="winner-crown">👑</span>
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
          <img :src="getFlagUrl(player2Nationality?.flag)" alt="Drapeau Joueur 2" />
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player2 ? player2.firstName + ' ' + player2.lastName : "En attente" }}
            <span v-if="match?.idWinner === match?.idPlayer2" class="winner-crown">👑</span>
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

  <!-- effet IPPON -->
  <div v-if="showIpponEffect" class="effect-container ippon-effect">
    <span class="effect-text">IPPON !!!</span>
    <span class="effect-player">{{ effectPlayerName }}</span>
  </div>

  <!-- effet KEIKOKU -->
  <div v-if="showKeikokuEffect" class="effect-container keikoku-effect">
    <span class="effect-text">KEIKOKU !!!</span>
    <span class="effect-player">{{ effectPlayerName }}</span>
  </div>

  <!-- flash d'écran -->
  <div v-if="showIpponEffect || showKeikokuEffect" class="screen-flash"></div>

  <!-- effet FIN DU TEMPS -->
  <div v-if="showTimeUpEffect" class="effect-container timeup-effect">
    <span class="effect-text">{{ timeUpText }}</span>
  </div>

  <!-- affichage du gagnant -->
  <div v-if="match?.idWinner" class="winner-banner">
    🏆 MATCH TERMINÉ ! Victoire de {{ winnerName }}
  </div>


</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { rep, getMatchById } from '@/replicache/stores/matchStore';
import { getParticipantById } from '@/replicache/stores/participantStore';
import { nationality } from '@/replicache/models/constants';

const route = useRoute();
const matchId = ref(route.params.id);
const match = ref(null);
const player1 = ref(null);
const player2 = ref(null);


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

// nom du vainqueur (affichee dans le message "MATCH TERMINÉ")
const winnerName = computed(() => {
  if (!match.value?.idWinner) return "";
  return match.value.idWinner === match.value.idPlayer1
    ? `${player1.value.firstName} ${player1.value.lastName}`
    : `${player2.value.firstName} ${player2.value.lastName}`;
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

  // verif si un IPPON a été marqué
  if (newMatch.ipponsPlayer1 > oldMatch.ipponsPlayer1) {
    triggerEffect("ippon", `${player1.value.firstName} ${player1.value.lastName}`);
  }
  if (newMatch.ipponsPlayer2 > oldMatch.ipponsPlayer2) {
    triggerEffect("ippon", `${player2.value.firstName} ${player2.value.lastName}`);
  }

  // verif si un KEIKOKU a été commis
  if (newMatch.keikokusPlayer1 > oldMatch.keikokusPlayer1) {
    triggerEffect("keikoku", `${player1.value.firstName} ${player1.value.lastName}`);
  }
  if (newMatch.keikokusPlayer2 > oldMatch.keikokusPlayer2) {
    triggerEffect("keikoku", `${player2.value.firstName} ${player2.value.lastName}`);
  }

  // Vérifie si le temps est écoulé
  if (newMatch.timer.currentTime === 0 && oldMatch.timer.currentTime > 0) {
    triggerTimeUpEffect("FIN DU TEMPS RÉGLEMENTAIRE");
  }
  if (newMatch.timer.additionalTime === 0 && oldMatch.timer.additionalTime > 0) {
    triggerTimeUpEffect("FIN DU TEMPS ADDITIONNEL");
  }
});

const showIpponEffect = ref(false);
const showKeikokuEffect = ref(false);
const showTimeUpEffect = ref(false);

const effectPlayerName = ref(""); // stocke le nom du joueur ayant marqué
const timeUpText = ref(""); // stocke le message de fin du temps

const triggerEffect = (type, playerName) => {
  effectPlayerName.value = playerName; // stocke le nom du joueur ayant marqué

  if (type === "ippon") {
    showIpponEffect.value = true;
    setTimeout(() => {
      showIpponEffect.value = false;
    }, 3000);
  } else if (type === "keikoku") {
    showKeikokuEffect.value = true;
    setTimeout(() => {
      showKeikokuEffect.value = false;
    }, 3000);
  }
};

const triggerTimeUpEffect = (message) => {
  timeUpText.value = message;
  showTimeUpEffect.value = true;
  setTimeout(() => {
    showTimeUpEffect.value = false;
  }, 4000);
};

function getCountry(natId) {
  return nationality.find(country => country.id === Number(natId));
}

function getFlagUrl(flagBase64) {
  return flagBase64 ? `data:image/png;base64,${flagBase64}` : '';
}

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
/* scoreboard prend toute la hauteur de l'écran */
.scoreboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  gap: 10px;
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

.player-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.player-name {
  font-size: clamp(1.5rem, 5vw, 7rem);
  font-weight: bold;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
}

.club-name {
  font-size: clamp(1rem, 3vw, 5rem);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
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

/* effet global */
.effect-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1);
  text-align: center;
  z-index: 9999;
  animation: zoomInOut 3s ease-in-out;
}

/* texte principal */
.effect-text {
  font-size: 9vw;
  font-weight: bold;
  display: block;
  text-transform: uppercase;
  text-shadow: 0px 0px 40px rgba(255, 255, 255, 1), 0px 0px 60px rgba(255, 69, 0, 1);
}

/* noom du joueur */
.effect-player {
  font-size: 4vw;
  font-weight: bold;
  margin-top: 10px;
  display: block;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0px 0px 20px rgba(255, 255, 255, 0.8), 0px 0px 40px rgba(255, 69, 0, 0.8);
}

/* IPPON -> Doré */
.ippon-effect .effect-text {
  color: gold;
}

.ippon-effect .effect-player {
  color: #ffd700;
}

/* KEIKOKU -> Rouge */
.keikoku-effect .effect-text {
  color: red;
}

.keikoku-effect .effect-player {
  color: #ff4d4d;
}

/* animation explosion badass */
@keyframes zoomInOut {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
}

/* efffet FIN DU TEMPS */
.timeup-effect {
  font-size: 6vw;
  font-weight: bold;
  color: white;
  text-shadow: 0px 0px 40px rgba(255, 255, 255, 1), 0px 0px 60px rgba(255, 69, 0, 1);
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  animation: fadeInOut 4s ease-in-out;
}

/* animation d’apparition/disparition du message "FIN DU TEMPS" */
@keyframes fadeInOut {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* Flash d'écran */
.screen-flash {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 1);
  animation: screenFlash 0.3s ease-in-out;
  z-index: 9998;
}

@keyframes screenFlash {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* bannière "MATCH TERMINÉ" */
.winner-banner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 5vw;
  font-weight: bold;
  color: rgb(255, 255, 255);
  text-shadow: 0px 0px 40px rgb(255, 0, 0), 0px 0px 60px rgba(255, 69, 0, 1);
  background: rgba(0, 0, 0, 0.8);
  padding: 20px 40px;
  border-radius: 10px;
  animation: fadeInOut 4s ease-in-out;
  z-index: 9999;
}

/* couronne du vainqueur */
.winner-crown {
  font-size: 3vw;
  margin-left: 10px;
  animation: crownGlow 2s infinite alternate;
}

/* effet brillant de la couronne */
@keyframes crownGlow {
  0% {
    text-shadow: 0px 0px 10px rgba(255, 215, 0, 0.5);
  }
  100% {
    text-shadow: 0px 0px 20px rgba(255, 215, 0, 1);
  }
}

/* animation d’apparition/disparition du message "MATCH TERMINÉ" */
@keyframes fadeInOut {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

</style>
