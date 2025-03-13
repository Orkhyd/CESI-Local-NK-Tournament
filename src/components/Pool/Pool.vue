<template>
  <div class="pool-container">
    <!-- entete de la poule -->
    <div class="pool-header">
      <h3>{{ pool.label }}</h3>
      <span class="badge">{{ pool.participants.length }} participants</span>
    </div>

    <div class="pool-content">
      <div class="pool-grid">
        <!-- paarticipants -->
        <div class="participants-list">
          <h4>Participants</h4>
          <ul>
            <li v-for="participant in pool.participants" :key="participant.id">
              <div class="avatar">{{ getInitials(participant) }}</div>
              <div class="info">
                <div>{{ participant.lastName }} {{ participant.firstName }}</div>
                <div class="club">{{ participant.clubName }}</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- classement -->
        <div class="standings">
          <h4>Classement</h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Participant</th>
                <th>MJ/MT</th>
                <th>MG</th>
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
              <tr v-for="(standing, index) in sortedStandings" :key="standing.participant.id"
                :class="[getMedalClass(index), { qualifying: index < pool.qualifyingPositions[0] }]">
                <td>{{ index + 1 }}</td>
                <td> <img v-if="getCountry(standing.participant.nationalityId)?.flag"
                    :src="getFlagUrl(getCountry(standing.participant.nationalityId).flag)" alt="Drapeau"
                    class="flag" />{{ standing.participant.lastName }} {{ standing.participant.firstName }}</td>
                <td>{{ standing.mj }}/{{ standing.mt }}</td>
                <td>{{ standing.mg }}</td>
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
      </div>

      <!-- matchs -->
      <div class="matches">
        <h4>
          Matchs
          <span class="badge">
            {{ getCompletedMatchCount() }}/{{ poolMatches.length }}
          </span>
          <span v-if="pool.isComplete"> (terminée)</span>
        </h4>
        <div class="matches-grid">
          <div v-for="match in poolMatches" :key="match.idMatch" class="match-card"
            :class="{ completed: match.idWinner !== null }" @click="editMatch(match)">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getMatchesByPool } from '@/replicache/stores/matchStore';
import { nationality } from '@/replicache/models/constants';

// def props
const props = defineProps({
  pool: {
    type: Object,
    required: true,
  },
  refreshMatches: {
    type: Number,
    default: 0
  }
});

// def emit
const emit = defineEmits(['edit-match']);

// var reactive pour stocker les matchs de la pool
const poolMatches = ref([]);

// fonction recup matchs (recup des matchs de la pool)
async function fetchPoolMatches() {
  poolMatches.value = await getMatchesByPool(props.pool.id);
  console.log(poolMatches.value);
}

// init : appel de la fonction recup au montage
onMounted(() => {
  fetchPoolMatches();
});

// watch : surveille refreshMatches et recup matchs quand change
watch(() => props.refreshMatches, () => {
  fetchPoolMatches();
});

// gestion des drapeaux et nationalités
const getCountry = (natId) => nationality.find(country => country.id === Number(natId));
const getFlagUrl = (flagBase64) => flagBase64 ? `data:image/png;base64,${flagBase64}` : '';

// computed : calcule et trie le classement (standings)
// logique metier : 1 pt par victoire, diff = ip - ic, etc.
const sortedStandings = computed(() => {
  // init stats pour chaque participant
  const stats = {};
  props.pool.participants.forEach(p => {
    stats[p.id] = {
      participant: p,
      mj: 0,  // matchs joues
      mt: 0,  // matchs totaux (programmés)
      mg: 0,  // matchs gagnes
      mp: 0,  // matchs perdus
      ip: 0,  // ippons pour
      ic: 0,  // ippons contre
      di: 0,  // diff ippons (ip - ic)
      kc: 0,  // keikoku contre
      kp: 0,  // keikoku pour
      points: 0 // points (1 pt par victoire)
    };
  });

  // calcule mt : recup total matchs pour chaque participant
  if (poolMatches.value && poolMatches.value.length > 0) {
    poolMatches.value.forEach(match => {
      if (match.idPlayer1 && stats[match.idPlayer1]) {
        stats[match.idPlayer1].mt++;
      }
      if (match.idPlayer2 && stats[match.idPlayer2]) {
        stats[match.idPlayer2].mt++;
      }
    });
  }

  // parcours des matchs finis pour modifs stats
  poolMatches.value.forEach(match => {
    // on ne prend en compte que les matchs finis (si idWinner existe)
    if (!match.idWinner) return;
    const p1 = match.idPlayer1;
    const p2 = match.idPlayer2;
    // inc mj : matchs joues pour les deux
    if (stats[p1]) stats[p1].mj++;
    if (stats[p2]) stats[p2].mj++;
    // modif victoires et defaites selon idWinner
    if (match.idWinner === p1) {
      if (stats[p1]) {
        stats[p1].mg++;         // match gagne
        stats[p1].points += 1;   // 1 pt par victoire
      }
      if (stats[p2]) stats[p2].mp++; // match perdu
    } else if (match.idWinner === p2) {
      if (stats[p2]) {
        stats[p2].mg++;
        stats[p2].points += 1;
      }
      if (stats[p1]) stats[p1].mp++;
    }
    // recup ippons et keikokus
    if (stats[p1]) {
      stats[p1].ip += match.ipponsPlayer1 || 0;
      stats[p1].ic += match.ipponsPlayer2 || 0;
      stats[p1].kc += match.keikokusPlayer1 || 0;
      stats[p1].kp += match.keikokusPlayer2 || 0;
    }
    if (stats[p2]) {
      stats[p2].ip += match.ipponsPlayer2 || 0;
      stats[p2].ic += match.ipponsPlayer1 || 0;
      stats[p2].kc += match.keikokusPlayer2 || 0;
      stats[p2].kp += match.keikokusPlayer1 || 0;
    }
  });

  // calc diff ippons : di = ip - ic
  Object.keys(stats).forEach(id => {
    stats[id].di = stats[id].ip - stats[id].ic;
  });

  // conversion en tableau et tri par pts, diff, puis mg
  const standArr = Object.values(stats);
  standArr.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.di !== a.di) return b.di - a.di;
    if (b.mg !== a.mg) return b.mg - a.mg;
    return 0;
  });

  return standArr;
});

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

// fonction qui applique classe medal en fonction de l'index
function getMedalClass(index) {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return '';
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

/* cellules du tableau, padding et alignement centre */
.standings th,
.standings td {
  padding: 8px;
  text-align: center;
}

/* en-tete du tableau, fond leger */
.standings th {
  background: #f5f5f5;
}

/* grille des matchs */
.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  line-clamp: 2;      /* nombre maximum de lignes */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  line-height: 1.2em;
  height: 2.4em; /* 1.2em x 2 lignes */
}

.stat small {
  font-size: 0.75em; /* texte plus petit */
  color: #555;       /* couleur legerement grise */
  margin-right: 4px; /* petit espacement */
}


/* style du drapeau, taille fixe, ajustement et bordure arrondie */
/* taille du drapeau et espace entre le drapeau et le nom */
.flag {
  width: 24px; /* taille du drapeau */
  height: 16px;
  object-fit: cover;
  border-radius: 3px;
  margin-right: 8px; /* espace entre le drapeau et le nom */
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

/* etat du match en attente, couleur */
.match-status.pending {
  color: #d32f2f;
}
</style>
