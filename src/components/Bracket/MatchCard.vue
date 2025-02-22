<template>
  <div class="match" :class="{ 'disabled-match': isDisabled }" @click="openModal">
    <div class="match-content">
      <span class="match-id">{{ match.id }}</span>
      <div class="players">
        <div class="player" v-for="(player, i) in [match.player1, match.player2]" :key="i"
          :class="getPlayerClass(player)">
          <span class="name">
            <VaIcon v-if="player?.id === match.winner?.id" class="crown" name="check_circle"/>
            {{ player?.prenom && player?.nom ? `${player.prenom} ${player.nom}` : player?.nom ?? "?" }}
          </span>
          <span class="score" v-if="match['score' + (i + 1)] !== null">
            {{ match["score" + (i + 1)] }}
          </span>
        </div>

      </div>
    </div>

    <MatchModal v-if="isModalOpen" :match="match" @close="closeModal" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import MatchModal from "../MatchModal.vue";

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
});

const isModalOpen = ref(false);

// calcul qui determine si un match est desactive
// un match est desactive si un gagnant est deja defini ou si un des joueurs est un "bye"
// un "bye" signifie qu un joueur est automatiquement qualifie sans jouer
const isDisabled = computed(() => {
  return (
    props.match.winner !== null ||
    props.match.player1?.nom === "BYE" ||
    props.match.player2?.nom === "BYE" ||
    props.match.player1?.nom?.startsWith("*Gagnant de") ||
    props.match.player2?.nom?.startsWith("*Gagnant de")
  );
});

// ouvre la modale si le match n est pas desactive
const openModal = () => {
  if (!isDisabled.value) {
    isModalOpen.value = true;
  }
};

// ferme la modale
const closeModal = () => {
  isModalOpen.value = false;
};

// determine la classe css appliquee a un joueur en fonction du gagnant du match
// si aucun gagnant n est defini alors on ne met pas de classe specifique
// si le joueur correspond au gagnant alors on lui applique la classe "winner"
// sinon on lui applique la classe "loser"
const getPlayerClass = (player) => {
  if (!props.match.winner) return "";
  return player?.id === props.match.winner?.id ? "winner" : "loser";
};
</script>

<style scoped>
/* conteneur principal du match */
.match {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 10px;
  padding: 15px;
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  flex-grow: 1;
  position: relative;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: opacity 0.3s, transform 0.2s;
}


/* couronne du gagnant */
.crown {
  font-size: 1.2rem;
  color: rgb(0, 103, 33);
  margin-right: 4px;
  vertical-align: middle;
}


/* match desactive (non cliquable) */
.match.disabled-match {
  opacity: 0.8;
  pointer-events: none;
}

.match-content {
  padding: 10px;
  border-radius: 10px;
  transition: box-shadow 0.3s ease-in-out, border 0.3s ease-in-out;
}

/* animation pour voir les matchs e ncours */
@keyframes rotating-dash {
  0% {
    border-image-source: linear-gradient(90deg, rgba(0, 0, 0, 0.7), transparent);
  }
  25% {
    border-image-source: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent);
  }
  50% {
    border-image-source: linear-gradient(270deg, rgba(0, 0, 0, 0.7), transparent);
  }
  75% {
    border-image-source: linear-gradient(360deg, rgba(0, 0, 0, 0.7), transparent);
  }
  100% {
    border-image-source: linear-gradient(90deg, rgba(0, 0, 0, 0.7), transparent);
  }
}

/* bordure pour voir les matchs e ncours */
.match:not(.disabled-match) .match-content {
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  border: 1px dashed rgba(0, 0, 0, 0.7); /* Bordure pointillée */
  border-image-slice: 1;
  animation: rotating-dash 2s linear infinite; /* Animation qui tourne */
}


/* structure interne du match */
.match-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
  justify-content: flex-start;
}

/* identifiant du match */
.match-id {
  font-weight: bold;
  font-size: 1rem;
  color: #444;
  text-align: right;
}

/* liste des joueurs du match */
.players {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}

/* effet au survol sur les joueurs */
.players:hover {
  transform: scale(1.02);
}

/* style des joueurs */
.player {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  height: 30px;
  border-radius: 5px;
  background-color: #f1f1f1;
  width: 100%;
  font-size: 1rem;
}

/* styles pour le gagnant du match */
.player.winner {
  background-color: rgba(0, 255, 0, 0.2);
}

.player.winner .name {
  color: green;
  font-weight: bold;
}

.player.winner .score {
  color: green;
  font-weight: bold;
}

/* styles pour le perdant du match */
.player.loser {
  background-color: rgba(255, 0, 0, 0.1);
  text-decoration: line-through;
  opacity: 0.5;
}

.player.loser .name {
  color: red;
}

.player.loser .score {
  color: red;
  font-weight: bold;
}
</style>
