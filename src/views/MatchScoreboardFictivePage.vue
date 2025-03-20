<template>
    <div class="scoreboard">
        <!-- lignes des joueurs -->
        <div class="scoreboard-row row-red">
            <div class="row-content">
                <div class="flag">
                    <img :src="getFlagUrl(player1Nationality?.flag)" alt="Drapeau Joueur 1" />
                </div>
                <div class="player-info" @contextmenu.prevent="openPlayerModal(1)">
                    <div class="player-name">
                        {{ player1?.participant || "En attente" }}
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
                <div class="player-info" @contextmenu.prevent="openPlayerModal(2)">
                    <div class="player-name">
                        {{ player2?.participant || "En attente" }}
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
                <div class="time-label">
                    {{ match?.timer.currentTime > 0 ? "Temps réglementaire" : (match?.timer.additionalTime > -1 ? "Temps additionnel" : "") }}
                </div>
            </div>
        </div>

        <!-- modal de modif de joueurs -->
        <va-modal v-model="showPlayerModal" size="small" hide-default-actions>
            <template #header>
                <h3>Modifier joueur {{ editedPlayer }}</h3>
            </template>

            <div class="form-container">
                <va-input v-model="editedParticipant" label="Participant" />
                <va-input v-model="editedClubName" label="Club" />
                <va-select v-model="editedNationality" label="Nationalité" :options="nationalityOptions" text-by="name"
                    value-by="id" searchable>
                    <template #content="{ value }">
                        <img :src="getFlagUrl(value.flag)" class="flag-option" />
                        {{ value.name }}
                    </template>
                </va-select>
            </div>

            <template #footer>
                <va-button @click="showPlayerModal = false" color="danger"
                    style="margin-right: 10px;">Fermer</va-button>
                <va-button @click="savePlayerChanges" color="primary">Enregistrer</va-button>
            </template>

        </va-modal>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { nationality } from '@/replicache/models/constants';

// donnees locales
const match = ref({
    ipponsPlayer1: 0,
    ipponsPlayer2: 0,
    keikokusPlayer1: 0,
    keikokusPlayer2: 0,
    timer: {
        currentTime: 180, // 3 minutes max
        additionalTime: -1,
        isRunning: false
    }
});

const player1 = ref({
    participant: 'Joueur 1',
    clubName: 'Club1',
    nationalityId: 73
});

const player2 = ref({
    participant: 'Joueur 2',
    clubName: 'Club2',
    nationalityId: 73
});

// gestion du modal
const showPlayerModal = ref(false);
const editedPlayer = ref(1);
const editedParticipant = ref('');
const editedClubName = ref('');
const editedNationality = ref(null);

// options de nationalite
const nationalityOptions = computed(() =>
    nationality.map(n => ({ ...n, label: n.name }))
);

const player1Nationality = computed(() =>
    nationality.find(n => n.id === player1.value.nationalityId)
);

const player2Nationality = computed(() =>
    nationality.find(n => n.id === player2.value.nationalityId)
);

// timer
let timerInterval = null;

// lancer ou pause du chrono
function toggleTimer() {
    if (match.value.timer.isRunning) {
        clearInterval(timerInterval);
    } else {
        timerInterval = setInterval(() => {
            if (match.value.timer.currentTime > 0) {
                match.value.timer.currentTime--;
            } else {
                clearInterval(timerInterval);
                match.value.timer.isRunning = false;
            }
        }, 1000);
    }
    match.value.timer.isRunning = !match.value.timer.isRunning;
}

// ajouter ou retirer du temps
function adjustTime(seconds) {
    match.value.timer.currentTime = Math.min(
        180, 
        Math.max(0, match.value.timer.currentTime + seconds)
    );
}

// ajouter ou retirer des points
function modifyPoints(player, type, amount) {
    if (player === 1) {
        if (type === 'ippon') match.value.ipponsPlayer1 = Math.max(0, match.value.ipponsPlayer1 + amount);
        if (type === 'keikoku') match.value.keikokusPlayer1 = Math.max(0, match.value.keikokusPlayer1 + amount);
    } else {
        if (type === 'ippon') match.value.ipponsPlayer2 = Math.max(0, match.value.ipponsPlayer2 + amount);
        if (type === 'keikoku') match.value.keikokusPlayer2 = Math.max(0, match.value.keikokusPlayer2 + amount);
    }
}

// gestion des raccourcis clavier
function handleKeydown(event) {
    switch (event.code) {
        case 'Space': // lancer ou pause le chrono
            toggleTimer();
            break;
        case 'Digit1': // +1 ippon joueur 1
            modifyPoints(1, 'ippon', 1);
            break;
        case 'Digit2': // -1 ippon joueur 1
            modifyPoints(1, 'ippon', -1);
            break;
        case 'Digit3': // +1 keikoku joueur 1
            modifyPoints(1, 'keikoku', 1);
            break;
        case 'Digit4': // -1 keikoku joueur 1
            modifyPoints(1, 'keikoku', -1);
            break;
        case 'Digit7': // +1 ippon joueur 2
            modifyPoints(2, 'ippon', 1);
            break;
        case 'Digit8': // -1 ippon joueur 2
            modifyPoints(2, 'ippon', -1);
            break;
        case 'Digit9': // +1 keikoku joueur 2
            modifyPoints(2, 'keikoku', 1);
            break;
        case 'Digit0': // -1 keikoku joueur 2
            modifyPoints(2, 'keikoku', -1);
            break;
        case 'Equal': // +5s au chrono (max 3 minutes)
            adjustTime(5);
            break;
        case 'Minus': // -5s au chrono (min 00:00)
            adjustTime(-5);
            break;
    }
}

// activer les raccourcis clavier au montage
onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

// desactiver les raccourcis clavier au demontage
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    clearInterval(timerInterval);
});

// gestion du modal
// gestion des joueurs
function openPlayerModal(playerNumber) {
    editedPlayer.value = playerNumber;
    const player = playerNumber === 1 ? player1.value : player2.value;

    editedParticipant.value = player.participant;
    editedClubName.value = player.clubName;

    editedNationality.value = nationality.find(n => n.id === player.nationalityId) || null;

    showPlayerModal.value = true;
}

function savePlayerChanges() {
    const player = editedPlayer.value === 1 ? player1.value : player2.value;

    player.participant = editedParticipant.value;
    player.clubName = editedClubName.value;

    player.nationalityId = editedNationality.value ? editedNationality.value : player.nationalityId;

    if (editedPlayer.value === 1) {
        player1.value = { ...player1.value };
    } else {
        player2.value = { ...player2.value };
    }

    showPlayerModal.value = false;
}

// calculs
const displayedTime = computed(() => {
    const minutes = Math.floor(match.value.timer.currentTime / 60);
    const seconds = match.value.timer.currentTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const progressPercent = computed(() =>
    (match.value.timer.currentTime / 180) * 100
);

function getFlagUrl(flagBase64) {
    return flagBase64 ? `data:image/png;base64,${flagBase64}` : '';
}
</script>



<style scoped>
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