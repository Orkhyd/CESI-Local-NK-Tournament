<template>
  <div id="bracketContainer" class="tournament-brackets" ref="bracketContainer">
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
            <template v-for="(match, matchIndex) in round.matches" :key="match.idMatch" class="match-match">
              <MatchCard :match="match" :disabled="match.idWinner !== null" :participants="participants"
                @updateBracket="loadRounds" :id="'match-' + match.idMatch" ref="matchRefs"
                :class="{ 'highlight-match': highlightedMatchId === match.idMatch }" />
              <!-- ddesactive le match s'il a déjà un gagnant -->
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
  <canvas id="minimap"></canvas>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import MatchCard from "./MatchCard.vue";
import { getRoundsByBracket } from "@/replicache/stores/Bracket/roundStore";
import { getMatchesByRound } from "@/replicache/stores/matchStore";
import pagemap from "pagemap";

const props = defineProps({
  bracket: {
    type: Object,
    required: true,
  },
  participants: {
    type: Array,
    required: true,
  },
  searchParticipant: {
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update']);

// stockage des rounds avec leurs matchs
const rounds = ref([]);

// attente du chargement complet des données avant exécution
const isDataReady = ref(false);

const highlightedMatchId = ref(null); // match en surbrillance quand recherche d'un joueur

const bracketContainer = ref(null); // ref au conteneur scrollable

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
            // traitement pour récupérer player1, player2, etc.
            let player1 = props.participants.find(p => p.id === match.idPlayer1) || null;
            let player2 = props.participants.find(p => p.id === match.idPlayer2) || null;

            if (!player1 && match.idPreviousMatch1) {
              const previousMatch = matchMap.get(match.idPreviousMatch1);
              player1 = previousMatch && !previousMatch.idWinner
                ? { id: match.idPreviousMatch1, lastName: `*Gagnant de ${match.idPreviousMatch1.split("-")[0]}` }
                : props.participants.find(p => p.id === previousMatch?.idWinner) || { id: previousMatch?.idWinner, lastName: "Inconnu" };
            }

            if (!player2 && match.idPreviousMatch2) {
              const previousMatch = matchMap.get(match.idPreviousMatch2);
              player2 = previousMatch && !previousMatch.idWinner
                ? { id: match.idPreviousMatch2, lastName: `*Gagnant de ${match.idPreviousMatch2.split("-")[0]}` }
                : props.participants.find(p => p.id === previousMatch?.idWinner) || { id: previousMatch?.idWinner, lastName: "Inconnu" };
            }

            return {
              ...match,
              player1: player1 || { id: match.idPlayer1, lastName: "BYE" },
              player2: player2 || { id: match.idPlayer2, lastName: "BYE" }
            };
          })
          // tri naturel sur l'ID du match pour emttre du plus petit au plus grand
          .sort((a, b) => {
            const extractBaseId = (idMatch) => idMatch.split("-")[0]; // prend tout avant le "-"

            const baseA = extractBaseId(a.idMatch);
            const baseB = extractBaseId(b.idMatch);

            const aNum = parseInt(baseA.replace(/\D/g, ''), 10);
            const bNum = parseInt(baseB.replace(/\D/g, ''), 10);

            return aNum - bNum;
          });


        return { ...round, matches };
      });


      // trier les rounds par le nombre de matchs (du plus grand au plus petit)
      updatedRounds.sort((a, b) => b.matches.length - a.matches.length);

      // mettre a jour les rounds avec les matchs associes
      rounds.value = updatedRounds;

      emit('update');
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

// permet de trovuer le match d'un joueur le plus avancé ( dans le tableau )
const findMostAdvancedMatch = (participantId) => {
  let latestMatch = null;

  for (const round of rounds.value) {
    for (const match of round.matches) {
      if (
        match.idPlayer1 === participantId ||
        match.idPlayer2 === participantId
      ) {
        latestMatch = match; // Met à jour le match le plus avancé
      }
    }
  }

  return latestMatch; // Retourne le dernier match trouvé
};


let highlightTimeout = null; // stockage du timeout en cours

// quand on clic sur un participant, le redirige vers son ancre html
watch(() => props.searchParticipant, async (searchParticipant) => {
  if (!searchParticipant || !searchParticipant.idParticipant) return;

  const latestMatch = findMostAdvancedMatch(searchParticipant.idParticipant);

  if (latestMatch) {
    await nextTick(); // attennd que le DOM soit mis à jour
    const matchElement = document.getElementById("match-" + latestMatch.idMatch);

    if (matchElement) {
      matchElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // annule le précédent timeout s'il existe
      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }

      // surbrillance
      highlightedMatchId.value = latestMatch.idMatch;

      // def un nouveau timeout pour retirer la surbrillance apres 3s
      highlightTimeout = setTimeout(() => {
        highlightedMatchId.value = null;
      }, 3000);
    }
  }
}, { deep: true }); // changements profonds dans l'objet


// chargement des données et exécute loadRounds()
onMounted(async () => {
  if (props.bracket?.id && props.participants?.length) {
    isDataReady.value = true;
    await loadRounds(); 

    await nextTick();

    // init pagemap après que le contenu est rendu
    if (bracketContainer.value) {
      pagemap(document.querySelector('#minimap'), {
        viewport: bracketContainer.value,
        styles: {
          '.match-content': 'rgba(0, 0, 0, 0.27)',
          '.finished': 'rgba(0, 255, 0, 0.8)',
          '.round-label': 'rgba(150, 150, 150, 0.8)',
        },
        back: 'rgba(240, 240, 240, 1)',
        view: 'rgba(0, 0, 0, 0.2)',
        drag: 'rgba(0, 0, 0, 0.2)',
        interval: 1,
      });
    }
  }
});
</script>

<style scoped>
.tournament-brackets {
  width: 80vw;
  height: 75vh;
  overflow: auto;
  border: 1px solid #ccc;
  padding: 10px;
}

/* style pour les titres des rounds (ex : "Demi-finale") */
.round-label {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
  position: sticky;
  top: 0;
  background: #fff;
  /* pour éviter que le contenu défilant ne se superpose */
  z-index: 1;
  /* pour le garder au-dessus des autres éléments */
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
  position: absolute;
  right: 0px;
  width: 10px;
  top: calc(50% + 1px);
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
}

/* zoom uniquement pour la MatchCard */
.highlight-match {
  animation: highlightAnimation 0.5s ease-in-out alternate infinite;
}


@keyframes highlightAnimation {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.03);
  }
}

#minimap {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 100px; 
  height: 200px;
  z-index: 1000;
  border: 1px solid rgba(0, 28, 42, 1);
  background-color: rgba(240, 240, 240, 1);
}
</style>
