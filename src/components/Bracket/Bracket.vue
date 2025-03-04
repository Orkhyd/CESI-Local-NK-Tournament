<template>
  <div class="tournament-brackets">
    <div class="bracket">
      <!-- boucle sur chaque round (phase du tournoi) -->
      <template v-for="(round, roundIndex) in rounds" :key="round.id">
        <div class="round-container">
          <!-- affichage du nom du round (Finale, Demi-finale, etc.) -->
          <div class="round-label">
            {{ getRoundLabel(round.matches.length, roundIndex, round.label) }}
          </div>

          <div class="round">
            <!-- boucle sur les matchs du round en cours -->
            <template v-for="(match, matchIndex) in round.matches" :key="match.idMatch">
              <MatchCard :match="match" :disabled="match.idWinner !== null" :participants="participants" @updateBracket="loadRounds" />
              <!-- ddesactive le match s'il a déjà un gagnant -->
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import MatchCard from "./MatchCard.vue";
import { getRoundsByBracket } from "@/replicache/stores/Bracket/roundStore";
import { getMatchesByRound } from "@/replicache/stores/matchStore";

const props = defineProps({
  bracket: {
    type: Object,
    required: true,
  },
  participants: {
    type: Array,
    required: true,
  },
});

// stockage des rounds avec leurs matchs
const rounds = ref([]);

// attente du chargement complet des données avant exécution
const isDataReady = ref(false);

/**
 * fnnction pour charger les rounds et les matchs associés
 */
 const loadRounds = async () => {
  try {
    // verif que les donnees necessaires sont disponibles
    if (!props.bracket.id || !props.participants.length) return;

    // recuperer tous les rounds du bracket
    const fetchedRounds = await getRoundsByBracket(props.bracket.id);

    if (fetchedRounds.length) {
      // charger tous les matchs associes a chaque round
      const allMatches = await Promise.all(
        fetchedRounds.map(round => getMatchesByRound(round.id))
      );

      // creer une map pour acceder rapidement aux matchs par leur id
      const matchMap = new Map();
      allMatches.flat().forEach(match => {
        matchMap.set(match.idMatch, match);
      });

      // associer les matchs a leur round et gerer les joueurs
      const updatedRounds = fetchedRounds.map(round => {
        const matches = allMatches
          .flat()
          .filter(match => match.idRound === round.id)
          .map(match => {
            
            // recuperer les joueurs a partir de leur id
            let player1 = props.participants.find(p => p.id === match.idPlayer1) || null;
            let player2 = props.participants.find(p => p.id === match.idPlayer2) || null;

            // si le match precedent n'a pas encore de gagnant, afficher "gagnant de id_match"
            if (!player1 && match.idPreviousMatch1) {
              const previousMatch = matchMap.get(match.idPreviousMatch1);
              player1 = previousMatch && !previousMatch.idWinner
                ? { id: match.idPreviousMatch1, lastName: `*Gagnant de ${match.idPreviousMatch1}` }
                : props.participants.find(p => p.id === previousMatch?.idWinner) || { id: previousMatch?.idWinner, lastName: "Inconnu" };
            }

            if (!player2 && match.idPreviousMatch2) {
              const previousMatch = matchMap.get(match.idPreviousMatch2);
              player2 = previousMatch && !previousMatch.idWinner
                ? { id: match.idPreviousMatch2, lastName: `*Gagnant de ${match.idPreviousMatch2}` }
                : props.participants.find(p => p.id === previousMatch?.idWinner) || { id: previousMatch?.idWinner, lastName: "Inconnu" };
            }

            return { 
              ...match, 
              player1: player1 || { id: match.idPlayer1, lastName: "BYE" },
              player2: player2 || { id: match.idPlayer2, lastName: "BYE" }
            };
          });

        return { ...round, matches };
      });

      // trier les rounds par le nombre de matchs (du plus grand au plus petit)
      updatedRounds.sort((a, b) => b.matches.length - a.matches.length);

      // mettre a jour les rounds avec les matchs associes
      rounds.value = updatedRounds;
    }
  } catch (error) {
    console.error("❌ erreur lors de la recuperation des rounds et matchs :", error);
  }
};



/**
 * ffonction qui retourne le nom du round en fonction du nombre de matchs
 */
const getRoundLabel = (matchCount, roundIndex, roundLabel) => {
  const labels = {
    1: "Finale",
    2: "Demi-finale",
    4: "Quart de finale",
    8: "8ème de finale",
    16: "16ème de finale",
  };

  // si le round a un vrai label (ex: "1/4 de finale"), on l'utilise
  if (roundLabel) return roundLabel;

  // sinon, utilise la correspondance avec le nombre de matchs
  return labels[matchCount] || `Tour ${roundIndex + 1}`;
};

// surveille le chargement des données et exécute loadRounds() quand tout est prêt
watch(
  () => [props.bracket, props.participants],
  ([bracket, participants]) => {
    if (bracket?.id && participants?.length) {
      isDataReady.value = true;
      loadRounds();
    }
  },
  { immediate: true } // verif au montage si les données sont déjà prêtes
);

</script>

<style scoped>
/* style pour les titres des rounds (ex : "Demi-finale") */
.round-label {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
}

/* conteneur principal du bracket (arbre du tournoi) */
.bracket {
  display: flex;
  /* affiche les rounds en ligne */
}

/* chaque round (ensemble de matchs d'une phase) est affiche en colonne */
.round {
  display: flex;
  flex-grow: 1;
  /* chaque round prend une part egale de l'espace disponible */
  flex-direction: column;
  justify-content: space-around;
  /* repartition egale des matchs */
}

/* conteneur d'un round avec son titre et ses matchs */
.round-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}

/* retire la bordure du dernier match du dernier round */
.round-container:last-child .round .match:last-child::after {
  display: none !important;
}

/* creation de la barre verticale reliant les matchs entre eux */
.match::before {
  content: "";
  display: block;
  min-height: 30px;
  border-left: 2px solid #333;
  /* ligne verticale */
  position: absolute;
  margin-left: -22px;
  transform: rotate(90deg);
}

/* ligne de liaison pour les matchs impairs (haut) */
.match:nth-child(odd)::after {
  content: "";
  display: block;
  border: 2px solid transparent;
  border-top-color: #333;
  border-right-color: #333;
  height: calc(50% + 10px);
  /* ajuste la taille pour relier les matchs */
  position: absolute;
  right: 0px;
  width: 10px;
  top: calc(50% + 1px);
  /* aligne correctement la liaison */
}

/* ligne de liaison pour les matchs pairs (bas) */
.match:nth-child(even)::after {
  content: "";
  display: block;
  border: 2px solid transparent;
  border-bottom-color: #333;
  border-right-color: #333;
  height: calc(50% + 10px);
  position: absolute;
  right: 0px;
  width: 10px;
  bottom: calc(50% + 1px);
  /* ajuste l'alignement */
}
</style>
