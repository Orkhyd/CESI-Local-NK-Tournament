<template>
  <VaModal v-model="isOpen" hide-default-actions transition="zoom" overlay-opacity="0.9"
    @update:model-value="handleModalValueUpdate" class="modal-container" no-padding no-dismiss no-esc-dismiss
    no-outside-dismiss>
    <div class="arena">
      <!-- entête -->
      <div class="header">
        <h1>Gestion du combat</h1>
        <button class="scoreboard-btn" @click="openScoreboard">
          <va-icon name="scoreboard" size="40px" title="Ouvrir le scoreboard du match." />
        </button>
      </div>

      <!-- combattants -->
      <div class="fighters">
        <!-- combattant 1 -->
        <div class="fighter" :class="{ winner: idWinner === match?.idPlayer1 }">
          <div class="fighter-info">
            <VaAvatar class="avatar" :title="player1Name">
              {{ avatarText(player1Name) }}
            </VaAvatar>
            <div class="name-flag">
              <span class="name">{{ player1Name }}</span>
              <img v-if="player1Nationality" :src="getFlag(player1Nationality)" alt="Drapeau" class="flag" />
            </div>
          </div>
          <div class="counters">
            <VaCounter v-model="ipponsPlayer1" :min="0" :max="2" :step="1" messages="IPPON"
              :disabled="isCounterDisabledP1" @update:model-value="disableCounters(1)" />
            <VaCounter v-model="keikokusPlayer1" :min="0" :max="10" :step="1" messages="KEIKOKU"
              :disabled="isCounterDisabledP1" @update:model-value="disableCounters(1)" />
          </div>
          <VaProgressBar :model-value="ipponsPlayer1 * 50" color="danger" :height="10" animated class="progress-bar" />
        </div>

        <!-- VS -->
        <div class="vs">
          <va-icon name="sports_martial_arts" size="32px" color="warning" />VS
        </div>

        <!-- combattant 2 -->
        <div class="fighter" :class="{ winner: idWinner === match?.idPlayer2 }">
          <div class="fighter-info">
            <VaAvatar class="avatar" :title="player2Name">
              {{ avatarText(player2Name) }}
            </VaAvatar>
            <div class="name-flag">
              <span class="name">{{ player2Name }}</span>
              <img v-if="player2Nationality" :src="getFlag(player2Nationality)" alt="Drapeau" class="flag" />
            </div>
          </div>
          <div class="counters">
            <VaCounter v-model="ipponsPlayer2" :min="0" :max="2" :step="1" messages="IPPON"
              :disabled="isCounterDisabledP2" @update:model-value="disableCounters(2)" />
            <VaCounter v-model="keikokusPlayer2" :min="0" :max="10" :step="1" messages="KEIKOKU"
              :disabled="isCounterDisabledP2" @update:model-value="disableCounters(2)" />
          </div>
          <VaProgressBar :model-value="ipponsPlayer2 * 50" color="danger" :height="10" animated class="progress-bar" />
        </div>
      </div>

      <!-- gagnant -->
      <div class="winner-placeholder">
        <div v-if="idWinner" class="winner-display">
          GAGNANT : {{ idWinner === match?.idPlayer1 ? player1Name : player2Name }}
        </div>
      </div>

      <!-- controles du timer -->
      <div class="timer-controls">
        <va-button class="timer-btn" size="medium" @click="addTime(-5)" icon="keyboard_double_arrow_left"
          color="success" :disabled="match?.timer?.currentTime > 0
            ? match?.timer?.currentTime < 5
            : (match?.timer?.additionalTime === -1 ? true : match?.timer?.additionalTime < 5)">
          - 5s
        </va-button>

        <va-button class="timer-btn" size="medium" :icon="match?.timer?.isRunning ? 'stop_circle' : 'play_arrow'"
          color="primary" @click="match?.timer?.isRunning ? stopTimer() : startTimer()" />

        <va-button class="timer-btn" size="medium" @click="addTime(5)" icon="keyboard_double_arrow_right"
          color="success" :disabled="isAddTimeDisabled">
          + 5s
        </va-button>

        <va-button class="timer-btn" size="medium" @click="resetTimer" icon="refresh" color="warning">
          Réinitialiser
        </va-button>

        <!-- btn Temps additionnel -->
        <va-button class="additional-btn" size="medium" @click="setAdditionalTime(60)" color="danger"
          :disabled="match?.timer?.currentTime !== 0 || match?.timer?.additionalTime !== -1">
          Temps additionnel (1min)
        </va-button>



      </div>

      <!-- affichage du temps -->
      <div class="timer-display">
        <p v-if="match?.timer?.currentTime !== 0 || match?.timer?.additionalTime === -1">
          Temps réglementaire : {{ formattedTime }}
        </p>
        <p v-else>
          Temps additionnel : {{ formattedTime }}
        </p>
      </div>

      <!-- boutons de contrôle -->
      <div class="controls">
        <va-button class="control-btn" color="secondary" @click="closeModal">
          Fermer
        </va-button>
        <va-button class="control-btn" color="danger" @click="handleWinnerDeclaration">
          Déclarer vainqueur
        </va-button>

      </div>
    </div>

    <!-- modale de confirmation pour déclarer le vainqueur -->
    <VaModal v-model="showWinnerConfirmation" size="small" hide-default-actions>
      <template #content>
        <div class="confirmation-container">
          <p v-if="idWinner" class="modal-text">
            🏆 {{ idWinner === match?.idPlayer1 ? player1Name : player2Name }} sera déclaré vainqueur du match.
          </p>
          <p v-else class="modal-text">
            ⚠️ Le score est égal.
          <p v-if="match?.idMatchType === 1">Vous devez désigner un vainqueur ou choisir le match nul.</p>
          <p v-else>Vous devez désigner un vainqueur.</p>
          </p>
          <p v-if="!idWinner" class="warning-text">
            Cette décision peut être basée sur une décision arbitrale ou un abandon.
            Une fois validée, elle sera <strong>irréversible</strong>.
          </p>

          <!-- select du vainqueur avec des checkbox -->
          <div v-if="!idWinner" class="winner-selection">
            <VaCheckbox v-model="selectedWinner" :true-value="match?.idPlayer1" :false-value="null"
              @update:model-value="clearOtherCheckbox(match?.idPlayer2)" :label="player1Name">
            </VaCheckbox>
            <VaCheckbox v-model="selectedWinner" :true-value="match?.idPlayer2" :false-value="null"
              @update:model-value="clearOtherCheckbox(match?.idPlayer1)" :label="player2Name"
              class="checkbox-player-2-modal">
              🏆 {{ player2Name }}
            </VaCheckbox>

            <!-- option pour déclarer un match nul (uniquement en mode poule) -->
            <div v-if="match?.idMatchType === 1" class="draw-option">
              <VaCheckbox v-model="selectedWinner" :true-value="-1" :false-value="null"
                @update:model-value="clearOtherCheckbox(null)" label="Match nul (égalité)">
              </VaCheckbox>
            </div>
          </div>

          <div class="modal-actions">
            <VaButton color="danger" @click="confirmWinner" :disabled="isConfirmDisabled">
              Confirmer
            </VaButton>
            <VaButton color="secondary" @click="showWinnerConfirmation = false"> Annuler </VaButton>
          </div>
        </div>
      </template>
    </VaModal>


  </VaModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getMatchById } from '@/replicache/stores/matchStore';
import { matchService } from '@/replicache/services/matchService';
import { nationality } from '@/replicache/models/constants';
import { getParticipantById } from '@/replicache/stores/participantStore';
import { replicacheInstance as rep } from '@/replicache/replicache';
import { useCountryFlags } from '@/utils/countryFlags';
import { useToast } from "vuestic-ui";

const { getFlag } = useCountryFlags();

const toast = useToast();

const props = defineProps({
  matchId: { type: String, required: true },
});

const emit = defineEmits(['close', 'update']);

const isOpen = ref(true);
const match = ref(null);
const player1 = ref(null);
const player2 = ref(null);

// scores des combattants
const ipponsPlayer1 = ref(0);
const ipponsPlayer2 = ref(0);
const keikokusPlayer1 = ref(0);
const keikokusPlayer2 = ref(0);

// desactivation des counter score pour pas spam
const isCounterDisabledP1 = ref(false);
const isCounterDisabledP2 = ref(false);

// var pour gérer la modale de confirmation
const showWinnerConfirmation = ref(false);
const selectedWinner = ref(null);

const isConfirmDisabled = computed(() => {
  return idWinner.value === null && selectedWinner.value === null;
});


// permett de désélectionner l'autre checkbox quand on en coche une
const clearOtherCheckbox = (otherId) => {
  if (selectedWinner.value === otherId || (otherId === null && selectedWinner.value !== -1)) {
    selectedWinner.value = null;
  }
};

// désactiver temporairement les compteurs
const disableCounters = (player) => {
  if (player === 1) {
    isCounterDisabledP1.value = true;
    setTimeout(() => {
      isCounterDisabledP1.value = false;
    }, 2000); // désactivation pendant 2 secondes
  } else if (player === 2) {
    isCounterDisabledP2.value = true;
    setTimeout(() => {
      isCounterDisabledP2.value = false;
    }, 2000);
  }
};


// fction pour confirmer définitivement le vainqueur
const confirmWinner = async () => {
  try {
    const finalWinner = selectedWinner.value || idWinner.value;
    const player1Name = `${player1.value?.firstName} ${player1.value?.lastName}`;
    const player2Name = `${player2.value?.firstName} ${player2.value?.lastName}`;

    if (match.value?.idMatchType === 1 && finalWinner === -1) {
      // cas du match nul en poule
      await matchService.updateMatch(match.value.idMatch, match.value.idMatchType, {
        ipponsPlayer1: ipponsPlayer1.value,
        ipponsPlayer2: ipponsPlayer2.value,
        keikokusPlayer1: keikokusPlayer1.value,
        keikokusPlayer2: keikokusPlayer2.value,
        idWinner: -1,
      });

      toast.init({
        message: `🏳️ Match nul entre ${player1Name} et ${player2Name}`,
        color: "warning",
        position: "top-center",
        icon: "sports_score",
      });
    } else {
      // cas normal avec vainqueur
      const winnerName = finalWinner === match.value?.idPlayer1 ? player1Name : player2Name;
      const loserName = finalWinner === match.value?.idPlayer1 ? player2Name : player1Name;

      await matchService.updateMatch(match.value.idMatch, match.value.idMatchType, {
        ipponsPlayer1: ipponsPlayer1.value,
        ipponsPlayer2: ipponsPlayer2.value,
        keikokusPlayer1: keikokusPlayer1.value,
        keikokusPlayer2: keikokusPlayer2.value,
        idWinner: finalWinner,
      });

      toast.init({
        message: `🏆 ${winnerName} a battu ${loserName} (${ipponsPlayer1.value}-${ipponsPlayer2.value})`,
        color: "success",
        position: "top-center",
        icon: "military_tech",
      });
    }

    emit('update');
    showWinnerConfirmation.value = false;
    selectedWinner.value = null;
    stopTimer();
    closeModal();

  } catch (error) {
    console.error("Erreur lors de la déclaration du vainqueur :", error);
    toast.init({
      message: "❌ Échec de la déclaration du résultat",
      color: "danger",
      position: "top-center",
      icon: "error_outline",
    });
  }
};

const isAddTimeDisabled = computed(() => {
  if (match.value?.timer?.currentTime > 0) {
    return match?.value?.timer?.currentTime + 5 > 180; // dépasse 180s en temps réglementaire
  } else if (match.value?.timer?.additionalTime !== -1) {
    return match?.value?.timer?.additionalTime + 5 > 60; // dépasse 60s en temps additionnel
  }
  return true; // si on ne peut pas ajouter de temps
});


// fonction pour gérer le clic sur le bouton "Déclarer vainqueur"
const handleWinnerDeclaration = () => {
  if (idWinner.value) {
    // si un vainqueur est clair, affiche la confirmation normale
    showWinnerConfirmation.value = true;
  } else {
    // si le score est égal, affiche la modale de sélection
    showWinnerConfirmation.value = true;
  }
};

// determinee le vainqueur en fonction des scores
const idWinner = computed(() => {
  if (ipponsPlayer1.value > ipponsPlayer2.value) return match.value?.idPlayer1;
  if (ipponsPlayer2.value > ipponsPlayer1.value) return match.value?.idPlayer2;
  return null;
});

// infos des combattants
const player1Name = computed(() => (player1.value?.firstName + ' ' + player1.value?.lastName) || 'Bye');
const player2Name = computed(() => (player2.value?.firstName + ' ' + player2.value?.lastName) || 'Bye');

// gestion des drapeaux et nationalités
const getCountry = (natId) => nationality.find(country => country.id === Number(natId));

const player1Nationality = computed(() => getCountry(player1.value?.nationalityId));
const player2Nationality = computed(() => getCountry(player2.value?.nationalityId));

// ferme la modale et stoppe le timer
const closeModal = () => {
  isOpen.value = false;
  stopTimer();
  emit('close');
};

// gère la fermeture de la modale
const handleModalValueUpdate = (value) => {
  if (!value) closeModal();
};

// ouvre le scoreboard du match
const openScoreboard = () => {
  if (window.electron && window.electron.openMatchWindow) {
    const matchData = JSON.parse(JSON.stringify(match.value));
    window.electron.openMatchWindow(matchData);
  }
};


// gestion du timer
let timerInterval = null;

// démarre le timer
const startTimer = async () => {
  await matchService.startTimer(match.value.idMatch);
};

// stoppe le timer
const stopTimer = async () => {
  await matchService.stopTimer(match.value.idMatch);
};

// reinit le timer en fonction de l'état actuel
const resetTimer = async () => {
  if (match.value?.timer.currentTime === 0 && match.value.timer.additionalTime !== -1) {
    await matchService.setAdditionalTime(match.value.idMatch, 60);
  } else {
    await matchService.resetTimer(match.value.idMatch);
    await matchService.setAdditionalTime(match.value.idMatch, -1); // Remet le temps additionnel à -1
  }
};


// ajouute ou enlève du temps sur le timer
const addTime = async (seconds) => {
  if (match.value?.timer.currentTime === 0 && match.value.timer.additionalTime === -1) {
    await matchService.addTime(match.value.idMatch, seconds);
    return;
  }

  if (match.value?.timer.currentTime === 0) {
    const newAdditionalTime = match.value.timer.additionalTime + seconds;
    if (newAdditionalTime < 0) return;
    await matchService.setAdditionalTime(match.value.idMatch, newAdditionalTime);
  } else {
    const newTime = match.value.timer.currentTime + seconds;
    if (newTime < 0) return;
    await matchService.addTime(match.value.idMatch, seconds);
  }
};

// active le temps additionnel
const setAdditionalTime = async (seconds) => {
  await matchService.setAdditionalTime(match.value.idMatch, seconds);
};

// fotmatte le temps pour l'affichage
const formattedTime = computed(() => {
  if (!match.value?.timer) return "0:00";

  if (match.value.timer.currentTime !== 0) {
    const minutes = Math.floor(match.value.timer.currentTime / 60);
    const seconds = match.value.timer.currentTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  if (match.value.timer.additionalTime === -1) return "0:00";

  const minutes = Math.floor(match.value.timer.additionalTime / 60);
  const seconds = match.value.timer.additionalTime % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// genere les initiales d'un combattant pour son avatar
function avatarText(fullName) {
  if (!fullName) return '?';
  const parts = fullName.split(' ');
  return parts.length >= 2
    ? parts[0].charAt(0).toUpperCase() + '.' + parts[1].charAt(0).toUpperCase()
    : fullName.charAt(0).toUpperCase();
}

// déclare une variable pour stocker la fonction de désabonnement au match
let unsubscribeMatch;

// charge les données du match au montage du composant
onMounted(async () => {
  match.value = await getMatchById(props.matchId);
  player1.value = await getParticipantById(match.value.idPlayer1);
  player2.value = await getParticipantById(match.value.idPlayer2);

  ipponsPlayer1.value = match.value.ipponsPlayer1;
  ipponsPlayer2.value = match.value.ipponsPlayer2;
  keikokusPlayer1.value = match.value.keikokusPlayer1;
  keikokusPlayer2.value = match.value.keikokusPlayer2;

  if (match.value.timer.additionalTime === undefined || match.value.timer.additionalTime === null) {
    match.value.timer.additionalTime = -1;
  }

  unsubscribeMatch = rep.subscribe(
    async (tx) => await tx.get(`match/${props.matchId}`),
    async (updatedMatch) => {
      if (updatedMatch) {
        match.value = updatedMatch;
        player1.value = await getParticipantById(updatedMatch.idPlayer1);
        player2.value = await getParticipantById(updatedMatch.idPlayer2);
        ipponsPlayer1.value = updatedMatch.ipponsPlayer1;
        ipponsPlayer2.value = updatedMatch.ipponsPlayer2;
        keikokusPlayer1.value = updatedMatch.keikokusPlayer1;
        keikokusPlayer2.value = updatedMatch.keikokusPlayer2;
      }
    }
  );

  timerInterval = setInterval(async () => {
    if (match.value?.timer.isRunning) {
      if (match.value.timer.currentTime === 0) {
        if (match.value.timer.additionalTime > -1) {
          const newAdditionalTime = match.value.timer.additionalTime - 1;
          if (newAdditionalTime >= 0) {
            await matchService.setAdditionalTime(match.value.idMatch, newAdditionalTime);
          } else {
            await matchService.stopTimer(match.value.idMatch);
          }
        } else {
          await matchService.stopTimer(match.value.idMatch);
        }
      } else {
        const newTime = match.value.timer.currentTime - 1;
        if (newTime >= 0) {
          await matchService.addTime(match.value.idMatch, -1);
        }
      }
    }
  }, 1000);
});

// nettoie les abonnements lors du démontage du composant
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (unsubscribeMatch) unsubscribeMatch();
});

// met a jour en direct les scores du match
watch([ipponsPlayer1, ipponsPlayer2, keikokusPlayer1, keikokusPlayer2], async () => {
  await matchService.updateMatch(match.value.idMatch, match.value.idMatchType, {
    ipponsPlayer1: ipponsPlayer1.value,
    ipponsPlayer2: ipponsPlayer2.value,
    keikokusPlayer1: keikokusPlayer1.value,
    keikokusPlayer2: keikokusPlayer2.value,
  });

  // A VOIR SI ON LAISSE CA
  //stopTimer(); // arrete le timer quand un point ou faute est marqué
});

</script>

<style scoped>
.modal-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.arena {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.scoreboard-btn {
  background: transparent;
  border: none;
  cursor: pointer;
}

.confirmation-container {
  text-align: center;
  padding: 16px;
}

.modal-text {
  font-size: 1.2rem;
  margin-bottom: 16px;
}

.warning-text {
  font-size: 0.9rem;
  color: #ff4444;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.fighters {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.fighter {
  flex: 1;
  text-align: center;
  padding: 8px;
}

.fighter-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.avatar {
  margin-right: 8px;
}

.timer-display {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
}

.timer-controls {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

/* Assure une taille fixe pour chaque bouton */
.timer-controls .timer-btn {
  flex: 1;
  min-width: 80px;
}

/* Pour le bouton Temps additionnel : conserver l'espace même lorsqu'il est caché */
.additional-btn {
  flex: 2;
  transition: opacity 0.3s ease;
  font-size: 10px !important;
}

.draw-option {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}


.draw-option .va-checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
}

.additional-btn.hidden {
  flex: 2;
  opacity: 0;
  pointer-events: none;
}


.name-flag {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flag {
  width: 44px;
  height: 32px;
  object-fit: cover;
  margin-top: 4px;
  border-radius: 3px;
}

.counters {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  margin-bottom: 8px;
}

.progress-bar {
  margin-top: 8px;
}

.vs {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 0 8px;
  flex-shrink: 0;
  font-size: large;
  font-weight: bold;
  border: 2px solid black;
  border-radius: 30px;
}

.winner-placeholder {
  height: 24px;
  margin: 16px 0;
  text-align: center;
}

.checkbox-player-2-modal {
  margin-left: 30px;
}

.winner-display {
  color: green;
  font-size: 1rem;
}

.controls {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.control-btn {
  flex: 1;
}
</style>
