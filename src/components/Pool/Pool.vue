<template>
  <div class="pool-container">
    <!-- entete de la poule -->
    <div class="pool-header">
      <h3>{{ pool.label }}</h3>
      <span class="badge">{{ props.pool.participants.length }} participants</span>
    </div>

    <div class="pool-content">
      <div class="pool-grid">
        <!-- paarticipants -->
        <div class="participants-list">
          <h4>Participants</h4>
          <ul v-if="props.pool.participants.length > 0">
            <li v-for="participant in props.pool.participants" :key="participant.id"
              :data-participant-id="participant.id">
              <VaMenu preset="context" :options="['Détails']" @selected="(option) => openModal(participant)">
                <template #anchor>
                  <div class="participant-item">
                    <div class="avatar">{{ getInitials(participant) }}</div>
                    <div class="info">
                      <div>{{ participant.lastName }} {{ participant.firstName }}</div>
                      <div class="club">{{ participant.clubName }}</div>
                    </div>
                  </div>
                </template>
              </VaMenu>
            </li>
          </ul>
          <p v-else class="empty-placeholder">Aucun participant</p>
        </div>

        <!-- classement -->
        <div class="standings" v-if="sortedStandings.length > 0">
          <h4>Classement</h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Participant</th>
                <th>MJ/MT</th>
                <th>MG</th>
                <th>MN</th>
                <th>MP</th>
                <th>IP</th>
                <th>IC</th>
                <th>DI</th>
                <th>KP</th>
                <th>KC</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(standing) in sortedStandings" :key="standing.participant.id" class="ligne-participant"
                :class="[{ 'same-rank': sortedStandings.filter(s => s.rank === standing.rank).length > 1 }]">
                <td>
                  <span class="rank" :class="{ 'qualified-first': standing.position === 1 }">
                    {{ standing.position }}
                    <!-- affiche l icône d'alerte si plusieurs joueurs partagent la première place -->
                    <VaIcon v-if="standing.position === 1 && sortedStandings.filter(s => s.position === 1).length > 1"
                      name="warning" class="alert-icon"
                      title="La place du joueur dans le classement n'est pas réelle car il est a égalité avec un/d'autres joueur(s)." />
                  </span>
                </td>


                <td>
                  <VaMenu preset="context" :options="['Détails']"
                    @selected="(option) => openModal(standing.participant)">
                    <template #anchor>
                      <div class="participant-info">
                        <img v-if="getCountry(standing.participant.nationalityId)"
                          :src="getFlag(getCountry(standing.participant.nationalityId))" alt="Drapeau" class="flag" />
                        {{ standing.participant.lastName }} {{ standing.participant.firstName }}
                      </div>
                    </template>
                  </VaMenu>

                  <div class="match-history">
                    <span v-for="(match, index) in getMatchHistory(standing.participant.id)" :key="index"
                      class="history-bubble" :class="{
                        win: match.won,
                        lose: !match.won && match.played,
                        draw: match.draw,
                        'tie-break': match.tieBreak
                      }">
                      {{ match.won ? 'V' : (match.draw ? 'N' : (match.played ? 'P' : '')) }}
                    </span>
                  </div>

                </td>
                <td>{{ standing.mj }}/{{ standing.mt }}</td>
                <td>{{ standing.mg }}</td>
                <td>{{ standing.mn }}</td>
                <td>{{ standing.mp }}</td>
                <td>{{ standing.ip }}</td>
                <td>{{ standing.ic }}</td>
                <td>{{ standing.di }}</td>
                <td>{{ standing.kp }}</td>
                <td>{{ standing.kc }}</td>
                <td><b>{{ standing.points }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-placeholder">Aucun classement disponible</p>
      </div>

      <!-- matchs -->
      <div class="matches">
        <h4 class="padding-10-px">
          Matchs
          <span class="badge">
            {{ getCompletedMatchCount() }}/{{ poolMatches.length }}
          </span>
          <span v-if="pool.isComplete"> (terminée)</span>
        </h4>
        <div class="matches-grid" v-if="poolMatches.length > 0">
          <div v-for="match in poolMatches" :key="match.idMatch" class="match-card"
            :class="{ completed: match.idWinner !== null, 'additional-match': match.idMatch.includes('%ADDITIONNAL-MATCH') }"
            @click="editMatch(match)">
            <!-- entete du match -->
            <div class="match-header">
              Match
            </div>

            <!-- corps du match -->
            <div class="match-body">
              <!-- joueur 1 -->
              <div class="player-info">
                <div class="player-name" :class="{ winner: match.idWinner === match.idPlayer1 }">
                  {{ getParticipantName(match.idPlayer1) }}
                </div>
                <div class="player-stats">
                  <span class="stat">
                    <i class="icon-ippon"></i> <small>Ippon:</small> {{ match.ipponsPlayer1 || 0 }}
                  </span>
                  <span class="stat">
                    <i class="icon-keikoku"></i> <small>Keikoku:</small> {{ match.keikokusPlayer1 || 0 }}
                  </span>
                </div>
              </div>

              <!-- "vs" -->
              <div class="versus">vs</div>

              <!-- joueur 2 -->
              <div class="player-info">
                <div class="player-name" :class="{ winner: match.idWinner === match.idPlayer2 }">
                  {{ getParticipantName(match.idPlayer2) }}
                </div>
                <div class="player-stats">
                  <span class="stat">
                    <i class="icon-ippon"></i> <small>Ippon:</small> {{ match.ipponsPlayer2 || 0 }}
                  </span>
                  <span class="stat">
                    <i class="icon-keikoku"></i> <small>Keikoku:</small> {{ match.keikokusPlayer2 || 0 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- etat du match -->
            <div class="match-status" :class="match.idWinner ? 'finished' : 'pending'">
              {{ match.idWinner ? 'Terminé' : 'En attente' }}
            </div>
          </div>
        </div>
        <p v-else class="empty-placeholder">Aucun match programmé</p>
      </div>
    </div>
  </div>

  <VaModal v-model="showModal" size="large" hide-default-actions>
    <ParticipantDetails :participant="selectedParticipant" :participants="props.participants" />
    <template #footer>
      <VaButton @click="showModal = false" color="primary" round>
        Fermer
      </VaButton>
    </template>
  </VaModal>

</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { getMatchesByPool } from '@/replicache/stores/matchStore';
import { nationality } from '@/replicache/models/constants';
import { determinePoolRanking } from "@/functions/determinePoolRanking"
import ParticipantDetails from "../ParticipantDetails.vue"
import { matchService } from '@/replicache/services/matchService';
import { useCountryFlags } from '@/utils/countryFlags';

// def props
const props = defineProps({
  pool: {
    type: Object,
    required: true,
  },
  refreshMatches: {
    type: Number,
    default: 0
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

// def emit
const emit = defineEmits(['edit-match']);

// var reactive pour stocker les matchs de la pool
const poolMatches = ref([]);

// fonction recup matchs (recup des matchs de la pool)
async function fetchPoolMatches() {
  const rawMatches = await getMatchesByPool(props.pool.id);

  // separe les matchs normaux et les matchs additionnels
  const normalMatches = rawMatches.filter(match => !match.idMatch.includes('%ADDITIONNAL-MATCH'));

  // separe les matchs additionnels en terminés et non terminés
  const additionalMatchesFinished = rawMatches
    .filter(match => match.idMatch.includes('%ADDITIONNAL-MATCH') && match.idWinner !== null)
    .sort((a, b) => a.createdAt - b.createdAt); // trie les terminés par ordre de création

  const additionalMatchesPending = rawMatches
    .filter(match => match.idMatch.includes('%ADDITIONNAL-MATCH') && match.idWinner === null)
    .sort((a, b) => a.createdAt - b.createdAt); // trie les non terminés par ordre de création

  // applique l'algorithme d'équilibrage uniquement aux matchs normaux
  // const sortedNormalMatches = balanceMatchOrder(normalMatches);
  const sortedNormalMatches = await orderMatchesAccordingToTemplate( normalMatches, props.pool.participants.length );

  // fusionne dans le bon ordre
  poolMatches.value = [
    ...sortedNormalMatches, // matchs normaux équilibrés
    ...additionalMatchesFinished, // maatchs additionnels terminés
    ...additionalMatchesPending // matchs additionnels non terminés
  ];
}

// ordre en fonction du nombre de participants, d'après les stipulations pour les poules
async function orderMatchesAccordingToTemplate(matches, numberOfPlayers) {
  const orderTemplates = {
    3: ["1-2", "2-3", "1-3"],
    4: ["1-2", "3-4", "1-3", "2-4", "1-4", "2-3"],
    5: ["1-2", "4-3", "1-5", "2-3", "4-5", "1-3", "2-5", "1-4", "3-5", "2-4"],
    6: [
      "1-2", "3-4", "2-6", "1-5", "4-6", "2-3", "1-6", "4-5",
      "1-3", "2-5", "3-6", "1-4", "3-5", "2-4", "5-6"
    ]
  };

  const template = orderTemplates[numberOfPlayers];
  if (!template) {
    return matches;
  }

  const participants = props.pool.participants;
  const positionToId = {};
  participants.forEach((participant, index) => {
    positionToId[index + 1] = participant.id;
  });

  const orderedMatches = [];
  const usedMatches = new Set();
  const matchesToSwitchInDb = [];

  template.forEach(templateMatch => {
    const [templatePos1, templatePos2] = templateMatch.split('-').map(Number);
    const actualPlayer1 = positionToId[templatePos1];
    const actualPlayer2 = positionToId[templatePos2];

    if (!actualPlayer1 || !actualPlayer2) {
      return;
    }
    const originalMatch = matches.find(m =>
      (m.idPlayer1 === actualPlayer1 && m.idPlayer2 === actualPlayer2) ||
      (m.idPlayer1 === actualPlayer2 && m.idPlayer2 === actualPlayer1)
    );

    if (originalMatch && !usedMatches.has(originalMatch)) {
      const needsSwitch = originalMatch.idPlayer1 !== actualPlayer1 || originalMatch.idPlayer2 !== actualPlayer2;

      if (needsSwitch) {
        const displayMatch = {
          ...originalMatch,
          idPlayer1: actualPlayer1,
          idPlayer2: actualPlayer2
        };
        orderedMatches.push(displayMatch);
        matchesToSwitchInDb.push(originalMatch.idMatch); // Mark for DB switch
      } else {
        orderedMatches.push(originalMatch);
      }

      usedMatches.add(originalMatch);
    }
  });

  matches.forEach(match => {
    if (!usedMatches.has(match)) {
      orderedMatches.push(match);
    }
  });

  if (matchesToSwitchInDb.length > 0) {
    Promise.all(matchesToSwitchInDb.map(idMatch => matchService.switchPlayers(idMatch)))
      .catch(err => {
        console.error("Error switching players in database:", err);
      });
  }
  return orderedMatches;
}



// init : appel de la fonction recup au montage
onMounted(() => {
  fetchPoolMatches();
});

// watch : surveille refreshMatches et recup matchs quand change
watch(() => props.refreshMatches, () => {
  fetchPoolMatches();
});


// watcher pour searchParticipant pour emmener vers l'ancre du participant rechercher
watch(
  () => props.searchParticipant,
  async (newSearchParticipant) => {
    if (!newSearchParticipant || !newSearchParticipant.idParticipant) return;

    // trouve le participant dans la liste des participants de la poule
    const participant = props.pool.participants.find(
      (p) => p.id === newSearchParticipant.idParticipant
    );

    if (participant) {
      await nextTick();

      // trouuve l'élément DOM correspondant au participant
      const participantElement = document.querySelector(
        `[data-participant-id="${participant.id}"]`
      );

      if (participantElement) {
        // classe css pour l'animation de zoom
        participantElement.classList.add('highlight-participant');

        // défiler la page jusqu'a l'élément
        participantElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // retirer la classe css après 3 secondes
        setTimeout(() => {
          participantElement.classList.remove('highlight-participant');
        }, 3000);
      }
    }
  },
  { deep: true }
);

const showModal = ref(false);
const selectedParticipant = ref(null);

function openModal(participant) {
  selectedParticipant.value = participant;
  showModal.value = true;
}

// gestion des drapeaux et nationalités
const getCountry = (natId) => nationality.find(country => country.id === Number(natId));
const { getFlag } = useCountryFlags();

// computed : calcule et trie le classement (standings)
const sortedStandings = computed(() => {
  const standings = determinePoolRanking(props.pool.participants, poolMatches.value);

  // trier par rank
  standings.sort((a, b) => a.rank - b.rank);

  // ajouter une propriété `position` pour afficher le rang visuelllement
  let currentRank = 1;
  standings.forEach((standing, index) => {
    if (index > 0 && standing.rank !== standings[index - 1].rank) {
      currentRank = index + 1;
    }
    standing.position = currentRank;
  });

  return standings;
});


// recupere l historique des matchs d'un joueur
const getMatchHistory = (participantId) => {
  return poolMatches.value
    .filter(match => match.idPlayer1 === participantId || match.idPlayer2 === participantId)
    .map(match => ({
      won: match.idWinner === participantId,
      played: match.idWinner !== null,
      draw: match.idWinner === -1,
      tieBreak: match.idMatch.includes('%ADDITIONNAL-MATCH') // verif si c'est un match de départage
    }));
};

// fonction edit : ouvre editeur de match si match pas fini
function editMatch(match) {
  if (match.idWinner) return; // si match fini, on ne modifie pas
  emit('edit-match', match);
}

// fonction recup initials d'un participant
function getInitials(participant) {
  if (!participant) return '';
  const ln = participant.lastName || '';
  const fn = participant.firstName || '';
  return (ln.charAt(0) + (fn.charAt(0) || '')).toUpperCase();
}

// fonction recup nom complet d'un participant par id
function getParticipantName(participantId) {
  const part = props.pool.participants.find(p => p.id === participantId);
  return part ? `${part.lastName} ${part.firstName}` : 'n/a';
}

// fonction recup count matchs finis
function getCompletedMatchCount() {
  return poolMatches.value.filter(match => match.idWinner !== null).length;
}
</script>



<style scoped>
/* container de la pool, fond blanc, bordure arrondie, ombre, padding et marge inferieure */
.pool-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

/* header de la pool, disposition en flex, alignement centre et repartition de l'espace */
.pool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

/* titre de la header, suppression de la marge */
.pool-header h3 {
  margin: 0;
}

/* badge avec fond, couleur, padding, bordure arrondie et taille de police reduite */
.badge {
  background: #e0f7fa;
  color: #00796b;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
}

/* grille de la pool, utilisation de grid avec deux colonnes et ecart entre les elements */
.pool-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

/* liste des participants, suppression des puces et des marges */
.participants-list ul {
  list-style: none;
  padding: 0;
  margin: 0;

}

/* element de la liste des participants, disposition en flex et alignement centre */
.participants-list li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

/* avatar du participant, taille fixe, fond, couleur, bordure circulaire et centrage */
.avatar {
  width: 32px;
  height: 32px;
  background: #00796b;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

/* container d'information supplementaire */
.info {
  flex: 1;
}

/* style du club, taille de police reduite et couleur grise */
.club {
  font-size: 0.8em;
  color: #666;
}

/* tableau du classement, largeur complete et fusion des bordures */
.standings table {
  width: 100%;
  border-collapse: collapse;
}

.standings {
  background: white;
}

/* cellules du tableau, padding et alignement centre */
.standings th,
.standings td {
  padding: 8px;
  text-align: left !important;
  vertical-align: middle;
}

/* alignement à gauche pour les titres et listes */
.participants-list h4,
.participants-list ul,
.participants-list li,
.standings h4,
.standings table,
.matches h4,
.matches .matches-grid {
  text-align: left !important;
}

/* en-tete du tableau, fond leger */
.standings th {
  background: #f5f5f5;
}

/* grille des matchs */
.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  margin: 16px 0;
}

/* carte d'un match, fond blanc, bordure arrondie, ombre et padding */
.match-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

/* effet hover sur la carte, translation vers le haut et ombre renforcee */
.match-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* style specifique pour les matchs termine, bordure a gauche, fond modifie et desactivation des interractions */
.match-card.completed {
  border-left: 4px solid #00796b;
  background: #e0f7fa;
  pointer-events: none;
  cursor: not-allowed;
}

/* entete du match, taille de police augmentee, poids de police, marge inferieure, couleur et alignement centre */
.match-header {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
  text-align: center;
}

/* corps du match, utilisation de css grid pour une structure fixe */
/* deux colonnes pour les joueurs et une colonne centrale pour le "vs" */
.match-body {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}

/* container des informations d'un joueur */
/* fixe une hauteur minimale pour eviter que l'expansion du nom ne deforme la carte */
.player-info {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* limite le nom a 2 lignes en utilisant le line clamping */
.player-name {
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 8px;
  color: #444;
  /* technique de clamp pour 2 lignes */
  display: -webkit-box;
  line-clamp: 2;
  /* nombre maximum de lignes */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  line-height: 1.2em;
  height: 2.4em;
  /* 1.2em x 2 lignes */
}

.stat small {
  font-size: 0.75em;
  /* texte plus petit */
  color: #555;
  /* couleur legerement grise */
  margin-right: 4px;
  /* petit espacement */
}


/* style du drapeau, taille fixe, ajustement et bordure arrondie */
/* taille du drapeau et espace entre le drapeau et le nom */
.flag {
  width: 24px;
  /* taille du drapeau */
  height: 16px;
  object-fit: cover;
  border-radius: 3px;
  margin-right: 8px;
  /* espace entre le drapeau et le nom */
  margin-top: 0px;
}

/* couleur du nom en cas de victoire */
.player-name.winner {
  color: #00796b;
}

/* statistiques du joueur, taille de police reduite, couleur grise et disposition en colonne */
.player-stats {
  font-size: 0.9em;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* style du score, taille de police, poids et marge inferieure */
.score {
  font-size: 1em;
  font-weight: bold;
  color: #00796b;
  margin-bottom: 4px;
}

/* style des ippons et keikoku, taille de police reduite et petite marge inferieure */
.ippons,
.keikoku {
  font-size: 0.85em;
  margin-bottom: 2px;
}

.a {
  color: rgb(26, 83, 242) !important;
}

/* separateur "vs", taille de police, poids, marge horizontale et couleur */
.versus {
  font-size: 1.1em;
  font-weight: bold;
  margin: 0 12px;
  color: #888;
}

/* style pour la zone de qualification, couleur de fond */
/* change cette couleur selon tes preferences */
.qualifying {
  background-color: #ceeaff;
}

/* etat du match, taille de police reduite, alignement centre, padding et bordure superieure */
.match-status {
  font-size: 0.9em;
  text-align: center;
  padding: 8px;
  border-top: 1px solid #ddd;
}

/* etat du match termine, couleur, poids de police et desactivation des interractions */
.match-status.finished {
  color: #00796b;
  font-weight: bold;
  pointer-events: none;
}

.ligne-participant {
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
}


/* etat du match en attente, couleur */
.match-status.pending {
  color: #d32f2f;
}

/* conteneur du nom, prénom et drapeau */
.participant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* conteneur des bulles d'historique */
.match-history {
  display: flex;
  gap: 5px;
  margin-top: 7px;
}

/* Style pour les rangs */
.rank {
  font-weight: bold;
  color: #333;
}

.qualified-first {
  background-color: blue;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9em;
}

.alert-icon {
  color: red;
  margin-left: 4px;
  width: 2px;
  height: 2px;

}

.additional-match {
  border: 2px dashed orange;
  /* une bordure en pointillé pour signaler l'extra */
  position: relative;
}

.additional-match::after {
  content: 'Départage';
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: orange;
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.7em;
}

.same-rank {
  font-style: italic;
  color: #666;
}


/* Style pour les lignes du tableau */
.ligne-participant {
  transition: background-color 0.3s;
}

.ligne-participant:hover {
  background-color: #f5f5f5;
}

/* style pour les bulles d'historique des matchs */
.history-bubble {
  display: inline-flex;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 1px;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  color: white;
}


.history-bubble.win {
  background-color: green;
}

.history-bubble.lose {
  background-color: red;
}

.history-bubble.draw {
  background-color: yellow;
  color: black;
}

.history-bubble:not(.win):not(.lose) {
  background-color: #ccc;
}

.history-bubble.tie-break {
  outline: 1.5px dashed orange;
  margin-left: 2px;
  outline-offset: 1.5px;
  /* Distance entre la bulle et la bordure */
}


.participant-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s ease-in-out;
  cursor: pointer;
}

.participant-item:hover {
  background: rgba(0, 120, 255, 0.1);
}

/* animation de zoom pour le participant recherché */
.highlight-participant {
  animation: zoomHighlight 3s ease-in-out;
}

@keyframes zoomHighlight {
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

.empty-placeholder {
  text-align: center;
  font-size: 1rem;
  color: #888;
  padding: 20px;
  font-style: italic;
  background: #f8f8f8;
  border-radius: 8px;
}

.padding-10-px {
  padding: 10px;
}
</style>
