<template>
  <div class="match" :class="{ 'disabled-match': isDisabled }" @click="openModal">
    <div class="match-content">
      <span class="match-id">{{ match.idMatch }}</span>
      <div class="players">
        <div class="player" v-for="(player, i) in [match.player1, match.player2]" :key="i"
          :class="getPlayerClass(player)">
          <div class="player-info">
            <img v-if="player.nationalityId" :src="getFlagUrl(getCountry(player.nationalityId)?.flag)" alt="drapeau"
              class="player-flag" />
            <span class="name">
              {{ player?.firstName && player?.lastName ? `${player.firstName} ${player.lastName}` : player.lastName }}
            </span>
          </div>
          <span class="score" v-if="match['score' + (i + 1)] !== null">
            {{ match["ipponsPlayer" + (i + 1)] }}
          </span>
        </div>
      </div>
    </div>

    <MatchModal v-if="isModalOpen" :matchId="props.match.idMatch" @close="closeModal" @update="refreshBracket" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import MatchModal from "../MatchModal.vue";
import { nationality } from "@/replicache/models/constants"

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updateBracket"]);

const refreshBracket = () => {
  emit("updateBracket");
};

const isModalOpen = ref(false);

// calcul qui determine si un match est desactive
// un match est desactive si un gagnant est deja defini ou si un des joueurs est un "bye"
// un "bye" signifie qu un joueur est automatiquement qualifie sans jouer
const isDisabled = computed(() => {
  return (
    props.match.idWinner !== null ||
    props.match.player1?.lastName === "BYE" ||
    props.match.player2?.lastName === "BYE" ||
    props.match.player1?.lastName?.startsWith("*Gagnant de") ||
    props.match.player2?.lastName?.startsWith("*Gagnant de")
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
  refreshBracket();

};

// determine la classe css appliquee a un joueur en fonction du gagnant du match
// si aucun gagnant n est defini alors on ne met pas de classe specifique
// si le joueur correspond au gagnant alors on lui applique la classe "winner"
// sinon on lui applique la classe "loser"
const getPlayerClass = (player) => {
  if (!props.match.idWinner) return "";
  return player?.id === props.match.idWinner ? "winner" : "loser";
};

// reocuperer le nom du pays avec l'id
const getCountry = (natId) => {
  return nationality.find(country => country.id === Number(natId));
};

// recuperer l image en base 64
const getFlagUrl = (flagBase64) => {
  return flagBase64 ? `data:image/png;base64,${flagBase64}` : '';
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
  width: 350px;
  min-width: 350px;
  max-width: 350px;
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

.player-flag {
  width: 20px;
  height: auto;
  margin-right: 5px;
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
  font-size: 10px;
  font-size: 1rem;
}

/* styles pour le gagnant du match */
.player.winner {
  background-color: rgba(0, 255, 0, 0.2);
}

.player.winner .name {
  color: green;
  font-weight: bold;
  font-size: 14px;
}

.name {
  font-size: 12px;
  text-align: left;
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
