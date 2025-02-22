<template>
  <VaModal
    v-model="isOpen"
    hide-default-actions
    no-dismiss
    overlay-opacity="0.6"
    class="custom-modal"
    size="small"
    @close="closeModal"
  >
    <template #header>
      <h2 class="modal-title">Détails du Match</h2>
    </template>

    <div class="modal-content">
      <div class="player-details">
        <div class="player-row">
          <span class="player-name">{{ match.player1.nom }}</span>
          <VaInput
            type="number"
            v-model.number="score1"
            :rules="[value => value >= 0 || 'Le score ne peut pas être négatif']"
            @input="updateCurrentWinner('score1')"
            class="score-input"
          />
        </div>

        <div class="player-row">
          <span class="player-name">{{ match.player2.nom }}</span>
          <VaInput
            type="number"
            v-model.number="score2"
            :rules="[value => value >= 0 || 'Le score ne peut pas être négatif']"
            @input="updateCurrentWinner('score2')"
            class="score-input"
          />
        </div>
      </div>

      <!-- Affichage du gagnant actuel -->
      <div class="winner-info">
        <span class="winner-label">Gagnant Actuel :</span>
        <span v-if="currentWinner" class="winner-name">{{
          currentWinner.nom
        }}</span>
        <span v-else class="winner-none">Aucun (Égalité)</span>
      </div>
    </div>

    <template #footer>
      <div class="buttons">
        <VaButton @click="saveScores" color="info" outline>
          Enregistrer Scores
        </VaButton>
        <VaButton
          color="success"
          @click="registerWinner"
          :disabled="!canRegisterWinner"
        >
          Terminer le Match
        </VaButton>
        <VaButton color="secondary" @click="closeModal"> Fermer </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script setup>
import { ref, computed } from "vue";
import { replicache } from "@/replicache.js";

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close"]);

// etat de la modale, defini sur ouvert au debut
const isOpen = ref(true);

// valeurs des scores des joueurs, initialisees avec les scores actuels ou a 0 si non definis
const score1 = ref(props.match.score1 || 0);
const score2 = ref(props.match.score2 || 0);

// calcul du gagnant actuel en fonction des scores
// si le score du joueur 1 est superieur a celui du joueur 2, joueur 1 est gagnant
// si le score du joueur 2 est superieur a celui du joueur 1, joueur 2 est gagnant
// si les scores sont egaux, pas de gagnant
const currentWinner = computed(() => {
  if (score1.value > score2.value) return props.match.player1;
  if (score2.value > score1.value) return props.match.player2;
  return null;
});

// verification si on peut enregistrer un gagnant
// un gagnant peut etre enregistre uniquement si un gagnant est defini et que les joueurs ne sont pas des "placeholders"
const canRegisterWinner = computed(() => {
  return (
    currentWinner.value !== null &&
    props.match.player1.id !== -1 &&
    props.match.player2.id !== -1
  );
});

// mise a jour du gagnant en temps reel, declenche le recalcul de la valeur currentWinner
const updateCurrentWinner = (score) => {
  if (score === 'score1' && score1.value < 0) { // empeche le score de descendre enb dessous de 0
    score1.value = 0;
  } else if (score === 'score2' && score2.value < 0) { // empeche le score de descendre enb dessous de 0
    score2.value = 0;
  }

  currentWinner.value; // recalcul le gagnant du match
};

// enregistrement des scores dans replicache
const saveScores = async () => {
  await replicache.mutate.updateMatch({
    matchId: props.match.id,
    updates: {
      score1: score1.value,
      score2: score2.value,
    },
  });
};

// enregistrement du gagnant et mise a jour de replicache
const registerWinner = async () => {
  if (canRegisterWinner.value) {
    await replicache.mutate.updateMatch({
      matchId: props.match.id,
      updates: {
        winner: currentWinner.value,
        score1: score1.value,
        score2: score2.value,
      },
    });

    // mise a jour du match suivant avec le gagnant
    await updateNextMatch(currentWinner.value);
    closeModal();
  }
};

// met a jour le prochain match avec le gagnant du match actuel
const updateNextMatch = async (winner) => {
  // recuperer tous les matchs dans replicache
  const allMatches = await replicache.query(async (tx) => {
    return (await tx.scan({ prefix: "match/" }).entries().toArray()).map(([_, match]) => match);
  });

  // filtrer uniquement les matchs qui ont le match actuel comme match precedent
  const nextMatches = allMatches.filter(match => 
    match.previousMatch1 === props.match.id || 
    match.previousMatch2 === props.match.id
  );

  // mise a jour des matchs suivants avec le gagnant
  for (const nextMatch of nextMatches) {
    const updates = {};

    // si le match actuel est en previousMatch1, mettre le gagnant en player1
    if (nextMatch.previousMatch1 === props.match.id) {
      updates.player1 = winner;
    } 
    // si le match actuel est en previousMatch2, mettre le gagnant en player2
    if (nextMatch.previousMatch2 === props.match.id) {
      updates.player2 = winner;
    }

    // si des mises a jour sont necessaires, les appliquer a replicache
    if (Object.keys(updates).length > 0) {
      await replicache.mutate.updateMatch({
        matchId: nextMatch.id,
        updates,
      });
    }
  }
};

// ferme la modale et emet un evenement pour prevenir le parent
const closeModal = () => {
  isOpen.value = false;
  emit("close");
};
</script>


<style scoped>
/* Modale */
.custom-modal {
  margin: auto;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Titre */
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  padding: 20px 0;
  color: #2c3e50;
  border-bottom: 1px solid #eaeef2;
  width: 100%;
  margin: 0;
}

/* contenu */
.modal-content {
  padding: 20px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

/* joueurs */
.player-details {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
  width: 100%;
}

.player-name {
  font-size: 1rem;
  font-weight: 600;
  flex-grow: 1;
  text-align: left;
  color: #34495e;
}

.score-input {
  width: 100px;
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 8px;
  background: #ffffff;
}

/* gagnant */
.winner-info {
  margin-top: 16px;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
}

.winner-name {
  color: #28a745;
  font-weight: bold;
  font-size: 1.1rem;
}

.winner-none {
  color: #dc3545;
  font-weight: bold;
  font-size: 1.1rem;
}

/* boutons */
.buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 20px;
  width: 100%;
}
</style>
