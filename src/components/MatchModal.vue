<template>
  <VaModal v-model="isOpen" hide-default-actions>
    <template #content>
      <div class="modal-container">
        <h2 class="modal-title">Mise à jour du match</h2>

        <!-- &affichage des joueurs et scores -->
        <div class="score-section">
          <div class="player-card" :class="{ winner: idWinner === props.match.idPlayer1 }">
            <h3>{{ player1Name }}</h3>
            <p class="club-name">{{ props.match.player1?.clubName || "Inconnu" }}</p>

            <label>Ippons :</label>
            <VaInput v-model="ipponsPlayer1" type="number" min="0" class="score-input" />
            <label>Keikokus :</label>
            <VaInput v-model="keikokusPlayer1" type="number" min="0" class="score-input" />
          </div>

          <div class="player-card" :class="{ winner: idWinner === props.match.idPlayer2 }">
            <h3>{{ player2Name }}</h3>
            <p class="club-name">{{ props.match.player2?.clubName || "Inconnu" }}</p>

            <label>Ippons :</label>
            <VaInput v-model="ipponsPlayer2" type="number" min="0" class="score-input" />
            <label>Keikokus :</label>
            <VaInput v-model="keikokusPlayer2" type="number" min="0" class="score-input" />
          </div>
        </div>

        <!-- btns d'actions -->
        <div class="modal-actions">
          <VaButton color="primary" @click="updateScores">Mettre à jour</VaButton>
          <VaButton 
            color="success" 
            :disabled="!canRegisterWinner" 
            @click="registerWinner"
          >
            Terminer le match
          </VaButton>
          <VaButton color="secondary" @click="closeModal">Annuler</VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script setup>
import { ref, computed } from "vue";
import { matchService } from "@/replicache/services/matchService";

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "update"]);

// etat de la modale
const isOpen = ref(true);

// recup des scores
const ipponsPlayer1 = ref(props.match.ipponsPlayer1);
const ipponsPlayer2 = ref(props.match.ipponsPlayer2);
const keikokusPlayer1 = ref(props.match.keikokusPlayer1);
const keikokusPlayer2 = ref(props.match.keikokusPlayer2);

// noms des joueurs
const player1Name = computed(() => props.match.player1?.firstName + " " + props.match.player1?.lastName || "Bye");
const player2Name = computed(() => props.match.player2?.firstName + " " + props.match.player2?.lastName || "Bye");

// détermination du gagnant
const idWinner = computed(() => {
  if (ipponsPlayer1.value > ipponsPlayer2.value) return props.match.idPlayer1;
  if (ipponsPlayer2.value > ipponsPlayer1.value) return props.match.idPlayer2;
  return null;
});

// verif  si un gagnant peut être enregistré
const canRegisterWinner = computed(() => idWinner.value !== null);

/**
 * mmet à jour les scores sans terminer le match
 */
const updateScores = async () => {
  await matchService.update(props.match.idMatch, {
    ipponsPlayer1: ipponsPlayer1.value,
    ipponsPlayer2: ipponsPlayer2.value,
    keikokusPlayer1: keikokusPlayer1.value,
    keikokusPlayer2: keikokusPlayer2.value,
  });

  emit("update");
  closeModal();
};

/**
 * termine le match et enregistre le gagnant
 */
const registerWinner = async () => {
  if (!canRegisterWinner.value) return;

  await matchService.update(props.match.idMatch, {
    ipponsPlayer1: ipponsPlayer1.value,
    ipponsPlayer2: ipponsPlayer2.value,
    keikokusPlayer1: keikokusPlayer1.value,
    keikokusPlayer2: keikokusPlayer2.value,
    idWinner: idWinner.value,
  });

  emit("update");
  closeModal();
};

/**
 * ferme la modale
 */
const closeModal = () => {
  isOpen.value = false;
  emit("close");
};
</script>

<style scoped>
.modal-container {
  padding: 20px;
  text-align: center;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.score-section {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.player-card {
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.player-card h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #222;
}

.club-name {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
}

.score-input {
  margin-bottom: 10px;
  width: 100%;
}

/* style du gagnant */
.winner {
  border: 3px solid #4CAF50;
  background: #eafaea;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
</style>
