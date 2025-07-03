<template>
    <div class="fictif-match-container" v-if="match">
        <va-card>
            <va-card-title>Match Fictif</va-card-title>
            <va-card-content>
                <!-- joueur 1 -->
                <div class="player-row player-red">
                    <div class="player-info">
                        <div class="flag-container">
                            <img :src="getFlag(getCountry(match.player1.nationalityId))" class="flag" />
                        </div>
                        <div class="player-details">
                            <va-input :model-value="match.player1.fullName"
                                @update:model-value="v => updatePlayerField(1, 'fullName', v)" label="Nom du joueur" />
                            <va-select :model-value="match.player1.nationalityId"
                                @update:model-value="v => updatePlayerField(1, 'nationalityId', v)"
                                :options="nationalityOptions" label="Nationalité" text-by="name" value-by="id"
                                searchable>
                                <template #content="{ value }">
                                    <img :src="getFlag(getCountry(value.id))" class="flag-option" />
                                    {{ value.name }}
                                </template>
                            </va-select>
                        </div>
                    </div>
                    <div class="score-controls">
                        <div class="score-display">
                            <span class="score-label">Ippons:</span>
                            <va-button-group>
                                <va-button @click="updateScore(1, 'ippons', -1)" icon="remove" />
                                <va-button disabled>{{ match.player1.ippons }}</va-button>
                                <va-button @click="updateScore(1, 'ippons', 1)" icon="add" />
                            </va-button-group>
                        </div>
                        <div class="score-display">
                            <span class="score-label">Keikokus:</span>
                            <va-button-group>
                                <va-button @click="updateScore(1, 'keikokus', -1)" icon="remove" />
                                <va-button disabled>{{ match.player1.keikokus }}</va-button>
                                <va-button @click="updateScore(1, 'keikokus', 1)" icon="add" />
                            </va-button-group>
                        </div>
                    </div>
                </div>

                <!-- joueur 2 -->
                <div class="player-row player-white">
                    <div class="player-info">
                        <div class="flag-container">
                            <img :src="getFlag(getCountry(match.player2.nationalityId))" class="flag" />
                        </div>
                        <div class="player-details">
                            <va-input :model-value="match.player2.fullName"
                                @update:model-value="v => updatePlayerField(2, 'fullName', v)" label="Nom du joueur" />
                            <va-select :model-value="match.player2.nationalityId"
                                @update:model-value="v => updatePlayerField(2, 'nationalityId', v)"
                                :options="nationalityOptions" label="Nationalité" text-by="name" value-by="id"
                                searchable>
                                <template #content="{ value }">
                                    <img :src="getFlag(getCountry(value.id))" class="flag-option" />
                                    {{ value.name }}
                                </template>
                            </va-select>
                        </div>
                    </div>
                    <div class="score-controls">
                        <div class="score-display">
                            <span class="score-label">Ippons:</span>
                            <va-button-group>
                                <va-button @click="updateScore(2, 'ippons', -1)" icon="remove" />
                                <va-button disabled>{{ match.player2.ippons }}</va-button>
                                <va-button @click="updateScore(2, 'ippons', 1)" icon="add" />
                            </va-button-group>
                        </div>
                        <div class="score-display">
                            <span class="score-label">Keikokus:</span>
                            <va-button-group>
                                <va-button @click="updateScore(2, 'keikokus', -1)" icon="remove" />
                                <va-button disabled>{{ match.player2.keikokus }}</va-button>
                                <va-button @click="updateScore(2, 'keikokus', 1)" icon="add" />
                            </va-button-group>
                        </div>
                    </div>
                </div>

                <!-- chrono -->
                <div class="timer-controls">
                    <div class="timer-display">
                        <va-progress-circle :model-value="timerProgress" :indeterminate="match.timer.isRunning"
                            color="#000000" :thickness="0.2" size="large" />
                        <div class="time-text">
                            {{ formattedTime }}
                            <div class="time-label">
                                Temps de match
                            </div>
                        </div>
                    </div>
                    <div class="timer-buttons">
                        <va-button @click="toggleTimer" :icon="match.timer.isRunning ? 'pause' : 'play_arrow'" />
                        <va-button @click="resetTimer" icon="restart_alt" />
                        <va-button @click="adjustTime(10)" icon="add" />
                        <va-button @click="adjustTime(-10)" icon="remove" />
                    </div>
                </div>
            </va-card-content>
        </va-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { nationality } from '@/replicache/models/constants';
import { fictifMatchService } from '@/replicache/services/fictifMatchService';
import { fictifMatchStore } from '@/replicache/stores/fictifMatchStore';
import { useCountryFlags } from '@/utils/countryFlags';

const MATCH_ID = 'current-fictif-match';
const match = ref(null);
let unsubscribe = null;
let timerInterval = null;
const getCountry = (natId) => nationality.find(country => country.id === Number(natId));
const { getFlag } = useCountryFlags();


// config de la nationalité
const nationalityOptions = nationality.map(n => ({
    id: n.id,
    name: n.name,
    flag: n.flag
}));

const formattedTime = computed(() => {
    if (!match.value) return '3:00';
    const time = match.value.timer.currentTime;
    return `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`;
});

const timerProgress = computed(() => {
    return match.value ? (match.value.timer.currentTime / 180) * 100 : 100;
});

// init
onMounted(async () => {
    try {
        // recup le match existant ou en crée un nouveau
        match.value = await fictifMatchService.initMatch(MATCH_ID);

        // si le timer était en cours, on le stoppe
        if (match.value?.timer?.isRunning) {
            await fictifMatchService.stopTimer(MATCH_ID);
            match.value.timer.isRunning = false;
        }

        // s'abonne aux modifications
        unsubscribe = fictifMatchStore.subscribe(MATCH_ID, updatedMatch => {
            match.value = updatedMatch;
        });
    } catch (error) {
        console.error("Error initializing match:", error);
    }
});

const cleanup = async () => {
    unsubscribe?.();
    clearInterval(timerInterval);

    if (match.value?.timer?.isRunning) {
        await fictifMatchService.stopTimer(MATCH_ID);
    }
};

onUnmounted(() => {
    cleanup().catch(console.error);
});


const updatePlayerField = async (playerNumber, field, value) => {
    if (!match.value) return;
    await fictifMatchService.updatePlayer(MATCH_ID, playerNumber, { [field]: value });
};

const updateScore = async (playerNumber, type, delta) => {
    if (!match.value) return;
    const current = match.value[`player${playerNumber}`][type];
    await updatePlayerField(playerNumber, type, Math.max(0, current + delta));
};

const toggleTimer = async () => {
    if (!match.value) return;
    const isRunning = !match.value.timer.isRunning;
    await fictifMatchService.updateTimer(MATCH_ID, { isRunning });

    if (isRunning) startTimer();
    else clearInterval(timerInterval);
};

const startTimer = () => {
    clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
        if (!match.value) return;
        const timer = { ...match.value.timer };

        if (timer.currentTime > 0) {
            timer.currentTime--;
        } else {
            clearInterval(timerInterval);
            timer.isRunning = false;
        }

        await fictifMatchService.updateTimer(MATCH_ID, timer);
    }, 1000);
};

const adjustTime = async (seconds) => {
    if (!match.value) return;
    const timer = { ...match.value.timer };
    timer.currentTime = Math.max(0, timer.currentTime + seconds);
    await fictifMatchService.updateTimer(MATCH_ID, timer);
};

const resetTimer = async () => {
    if (!match.value) return;
    await fictifMatchService.updateTimer(MATCH_ID, {
        isRunning: false,
        currentTime: 180
    });
    clearInterval(timerInterval);
};

</script>

<style scoped>
.fictif-match-container {
    width: 100%;
    max-width: 100vw;
    min-height: 100vh;
    padding: 2vh;
    box-sizing: border-box;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.va-card {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border: none;
}

.player-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 2vh 3vw;
    margin: 1vh 0;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.player-row:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.player-red {
    background: linear-gradient(to right, rgba(255, 235, 238, 0.9) 0%, rgba(255, 255, 255, 1) 100%);
    border-left: 5px solid #ff5252;
}

.player-white {
    background: linear-gradient(to right, rgba(245, 245, 245, 0.9) 0%, rgba(255, 255, 255, 1) 100%);
    border-left: 5px solid #9e9e9e;
}

.player-info {
    display: flex;
    align-items: center;
    gap: 2vw;
}

.flag {
    width: clamp(50px, 8vw, 70px);
    height: auto;
    aspect-ratio: 3/2;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
    border: 1px solid rgba(0, 0, 0, 0.08);
}

.flag-option {
    width: 30px;
    height: 20px;
    margin-right: 10px;
    vertical-align: middle;
}

.player-details {
    flex: 1;
    min-width: 0;
}

.score-controls {
    display: flex;
    flex-direction: column;
    gap: 1.5vh;
    min-width: 180px;
    margin-left: 3vw;
}

.score-display {
    display: flex;
    align-items: center;
    gap: 1vw;
}

.score-label {
    font-weight: 600;
    color: #424242;
    width: 80px;
    text-align: right;
}

.va-button-group {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.va-button-group .va-button {
    margin: 0;
    border-radius: 0;
}

.va-button[disabled] {
    background: #f5f5f5;
    color: #212121;
    font-weight: bold;
    min-width: 50px;
}

.timer-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2vh 3vw;
    background: linear-gradient(135deg, #2c3e50 0%, #1a1a1a 100%);
    border-radius: 10px;
    margin: 2vh 0;
    color: white;
}

.timer-display {
    display: flex;
    align-items: center;
    gap: 2vw;
}

.time-text {
    font-size: clamp(24px, 5vw, 42px);
    font-weight: 700;
    letter-spacing: 1px;
    font-family: 'Roboto Mono', monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 8px;
}

.time-label {
    font-size: clamp(14px, 2vw, 18px);
    opacity: 0.9;
    margin-top: 4px;
}

.timer-buttons {
    display: flex;
    gap: 1vw;
}

.timer-buttons .va-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
}

.timer-buttons .va-button:hover {
    background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
    .player-row {
        grid-template-columns: 1fr;
        gap: 2vh;
    }

    .score-controls {
        margin-left: 0;
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
    }

    .score-display {
        flex: 1;
        justify-content: flex-end;
    }

    .timer-controls {
        flex-direction: column;
        gap: 2vh;
    }

    .timer-buttons {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .player-info {
        flex-direction: column;
        align-items: flex-start;
    }

    .score-controls {
        flex-direction: column;
    }

    .score-display {
        justify-content: space-between;
    }

    .time-text {
        font-size: 20px;
    }
}

/* animations */
@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

.va-progress-circle--indeterminate {
    animation: pulse 1.5s infinite ease-in-out;
}
</style>
