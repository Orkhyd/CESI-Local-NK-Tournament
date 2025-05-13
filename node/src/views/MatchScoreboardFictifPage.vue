<template>
    <div class="scoreboard">
        <div class="scoreboard-row row-red">
            <div class="row-content">
                <div class="flag">
                    <div class="flag-placeholder">
                        <div v-if="!isFlag1Loaded" class="spinner"></div>
                    </div>
                    <img v-show="isFlag1Loaded" @load="flag1Loaded()" :src="getFlag(player1Nationality)"
                        alt="Drapeau Joueur 1" />
                </div>
                <div class="player-info">
                    <div class="player-name">
                        {{ fictifMatch?.player1?.fullName || "Joueur 1" }}
                    </div>
                    <div class="club-name">
                        {{ player1ClubName }}
                    </div>
                </div>
            </div>
            <div class="score-info">
                <div class="ippons">
                    {{ fictifMatch?.player1?.ippons || 0 }}
                </div>
                <div class="keikokus-player-1">
                    {{ fictifMatch?.player1?.keikokus || 0 }}
                </div>
            </div>
        </div>

        <div class="scoreboard-row row-white">
            <div class="row-content">
                <div class="flag">
                    <div class="flag-placeholder">
                        <div v-if="!isFlag2Loaded" class="spinner"></div>
                    </div>
                    <img v-show="isFlag2Loaded" @load="flag2Loaded()" :src="getFlag(player2Nationality)"
                        alt="Drapeau Joueur 2" />
                </div>
                <div class="player-info">
                    <div class="player-name">
                        {{ fictifMatch?.player2?.fullName || "Joueur 2" }}
                    </div>
                    <div class="club-name">
                        {{ player2ClubName }}
                    </div>
                </div>
            </div>
            <div class="score-info">
                <div class="ippons">
                    {{ fictifMatch?.player2?.ippons || 0 }}
                </div>
                <div class="keikokus-player-2">
                    {{ fictifMatch?.player2?.keikokus || 0 }}
                </div>
            </div>
        </div>

        <div class="scoreboard-row row-black">
            <div class="nippon-img-container">
                <img src="../assets/img/scoreboard_nippon_img.png" alt="Scoreboard Nippon"
                    class="scoreboard-nippon-img" />
            </div>
            <div class="other-content">
                <!-- chrono avec progress bar -->
                <div class="chrono-display">
                    <va-progress-circle :model-value="progressPercent" :indeterminate="match?.timer.isRunning"
                        color="#ffffff" class="timer-progress-circle" :thickness="0.2" />
                    <span class="time-text">{{ displayedTime }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { nationality } from '@/replicache/models/constants';
import { fictifMatchStore } from '@/replicache/stores/fictifMatchStore';
import { useCountryFlags } from '@/utils/countryFlags';

const isFlag1Loaded = ref(false);
const isFlag2Loaded = ref(false);

const flag1Loaded = () => {
    isFlag1Loaded.value = true;
}

const flag2Loaded = () => {
    isFlag2Loaded.value = true;
}

const FICTIF_MATCH_ID = 'current-fictif-match';
const fictifMatch = ref(null);
let unsubscribe = null;
const { getFlag } = useCountryFlags();

onMounted(async () => {
    // recup initiale
    fictifMatch.value = await fictifMatchStore.getById(FICTIF_MATCH_ID);

    // abonnement aux modifications
    unsubscribe = fictifMatchStore.subscribe(FICTIF_MATCH_ID, (updatedMatch) => {
        fictifMatch.value = updatedMatch;
    });
});

onUnmounted(() => {
    if (unsubscribe) unsubscribe();
});

const player1Nationality = computed(() => {
    return nationality.find(n => n.id === (fictifMatch.value?.player1?.nationalityId || 73));
});

const player2Nationality = computed(() => {
    return nationality.find(n => n.id === (fictifMatch.value?.player2?.nationalityId || 73));
});

const displayedTime = computed(() => {
    const time = fictifMatch.value?.timer?.currentTime ?? 0;
    const minutes = Math.floor(Math.abs(time) / 60);
    const seconds = Math.abs(time) % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const progressPercent = computed(() => {
    return ((fictifMatch.value?.timer?.currentTime ?? 0) / 180) * 100;
});

const gongSound = new Audio('finalSound.ogg');

watch(
  () => ({
    currentTime: fictifMatch.value?.timer?.currentTime,
    additionalTime: fictifMatch.value?.timer?.additionalTime,
  }),
  (newVal, oldVal) => {
    if (
      oldVal.currentTime > 0 &&
      newVal.currentTime === 0 &&
      (newVal.additionalTime === undefined || newVal.additionalTime === -1)
    ) {
      gongSound.play().catch((err) => {
        console.error('Erreur lors de la lecture du son :', err);
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

.flag-option {
    width: 30px;
    height: 20px;
    margin-right: 10px;
    vertical-align: middle;
}

.form-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
}
</style>
