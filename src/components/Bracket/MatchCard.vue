<template>
  <div class="match" :class="[{ 'disabled-match': isDisabled }, isPetiteFinale ? 'petite-finale-match' : '']"
    @click="openMatchModal">
    <div class="match-content">
      <span class="match-id">{{ match.idMatch.split("-")[0] }}</span>
      <div class="players">
        <!-- joueur 1 -->
        <VaMenu preset="context" :options="['Détails']" @selected="(option) => openPlayerModal(option, match.player1)">
          <template #anchor>
            <div class="player" :class="[ getPlayerClass(match.player1), { finished: isFinished } ]">
              <div class="player-info">
                <img v-if="match.player1.nationalityId" :src="getFlag(getCountry(match.player1.nationalityId))"
                  alt="drapeau" class="player-flag" />
                <span class="name">
                  {{ match.player1?.firstName && match.player1?.lastName ? `${match.player1.firstName}
                  ${match.player1.lastName}` : match.player1.lastName }}
                </span>
              </div>
              <div class="scores">
                <span class="score">{{ match.ipponsPlayer1 }}</span>
                <span class="keikoku">{{ match.keikokusPlayer1 }}</span>
              </div>
            </div>
          </template>
        </VaMenu>

        <div v-if="getMatchDuration()" class="match-duration-overlay">
          ⏳ {{ getMatchDuration() }}
        </div>


        <!-- joueur 2 -->
        <VaMenu preset="context" :options="['Détails']" @selected="(option) => openPlayerModal(option, match.player2)">
          <template #anchor>
            <div class="player" :class="[ getPlayerClass(match.player2), { finished: isFinished } ]">
              <div class="player-info">
                <img v-if="match.player2.nationalityId" :src="getFlag(getCountry(match.player2.nationalityId))"
                  alt="drapeau" class="player-flag" />
                <span class="name">
                  {{ match.player2?.firstName && match.player2?.lastName ? `${match.player2.firstName}
                  ${match.player2.lastName}` : match.player2.lastName }}
                </span>
              </div>
              <div class="scores">
                <span class="score">{{ match.ipponsPlayer2 }}</span>
                <span class="keikoku">{{ match.keikokusPlayer2 }}</span>
              </div>
            </div>
          </template>
        </VaMenu>
      </div>
    </div>

    <!--les statistiques du joueur -->
    <VaModal v-model="showPlayerModal" size="large" :hideDefaultActions="true">
      <ParticipantDetails :participant="selectedPlayer" :participants="participants" />
      <template #footer>
        <VaButton @click="showPlayerModal = false" color="primary" round>
          Fermer
        </VaButton>
      </template>
    </VaModal>

    <!--  match (uniquement si le match est actif) -->
    <MatchModal v-if="isModalOpen" :matchId="match.idMatch" @close="closeMatchModal" @update="refreshBracket" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import MatchModal from "../MatchModal.vue";
import { nationality } from "@/replicache/models/constants"
import ParticipantDetails from "../ParticipantDetails.vue";
import { useCountryFlags } from "@/utils/countryFlags";

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
  participants: {
    type: Array,
    required: true
  },
  searchParticipant: {
    type: Object,
    default: null,
  }
});

const showPlayerModal = ref(false);
const selectedPlayer = ref(null);

// ouvrir la modale pour un joueur
const openPlayerModal = (option, player) => {
  if (option === "Détails" && player) {
    selectedPlayer.value = player;
    showPlayerModal.value = true;
  }
};

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
    props.match.player2?.lastName?.startsWith("*Gagnant de") ||
    props.match.player2?.lastName?.startsWith("*Perdant de") ||
    props.match.player2?.lastName?.startsWith("*Perdant de")
  );
});

const isPetiteFinale = computed(() => props.match.idMatch.startsWith("PF-"));

// ouvre la modale si le match n est pas desactive
const openMatchModal = () => {
  if (!isDisabled.value) {
    isModalOpen.value = true;
  }
};


// ferme la modale
const closeMatchModal = () => {
  isModalOpen.value = false;
  refreshBracket();
};

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getMatchDuration = () => {
  if (props.match.timer.currentTime >= 180) return null; // affiche rien si le match n'est pas fini

  const { currentTime, additionalTime } = props.match.timer;
  let duration = 180 - currentTime; // ttemps écoulé en temps réglementaire

  if (additionalTime > -1) {
    duration += 60 - additionalTime; // ajoute le temps additionnel écoulé
  }

  return formatTime(duration);
};

const isFinished = computed(() => {
  return props.match.idWinner !== null;
});


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

const { getFlag } = useCountryFlags();

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
  z-index: 1;
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

/* Réactiver le clic sur les joueurs même si la carte est désactivée */
.match.disabled-match .player {
  pointer-events: auto;
}

.match-content {
  padding: 10px;
  border-radius: 10px;
  transition: box-shadow 0.3s ease-in-out, border 0.3s ease-in-out;
  background: white;
}

.match-duration-overlay {
  position: absolute;
  top: 50%;
  left: 75%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.5);
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.6rem;
  font-weight: bold;
  color: #444;
  z-index: 1;
}

.petite-finale-match {
  transform: scale(0.85);
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
  border: 1px dashed rgba(0, 0, 0, 0.7);
  /* Bordure pointillée */
  border-image-slice: 1;
  animation: rotating-dash 2s linear infinite;
  /* Animation qui tourne */
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

.finished {
  background-color: rgba(0,0,0,0);
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

/* conteneur des scores */
.scores {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

/* style des Ippons */
.score {
  font-size: 1.2rem;
}

/* style des Keikokus */
.keikoku {
  font-size: 0.6rem;
  align-self: flex-end;
}

/* llignement des Keikokus pour le joueur du haut */
.player:first-child .keikoku {
  align-self: flex-end;
}

/* llignement des Keikokus pour le joueur du bas */
.player:last-child .keikoku {
  align-self: flex-start;
}

/* style du chrono */
.timer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* icône du chrono */
.timer .icon {
  font-size: 1.5rem;
}

/*  temps */
.timer .time {
  font-size: 1rem;
}
</style>
