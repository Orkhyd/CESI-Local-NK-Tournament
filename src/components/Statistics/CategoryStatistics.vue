<template>
  <div class="category-stats">
    <div>
      <h3>Statistiques de la Catégorie</h3>
      <button @click="showQRModal = true" class="qr-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <div>QR CODE</div>
      </button>

      <p v-if="loading">⏳ Chargement des données...</p>
      <p v-else-if="matches.length === 0">⚠️ Aucun match trouvé.</p>

      <div class="stats-container" v-if="!loading && matches.length > 0">
        <!-- podium Ippons -->
        <Podium title="Top Ippons" :ranking="topIppons" />

        <!-- donut Chart nombre amtch jouée et pas terminé -->
        <div class="donut-container">
          <apexchart type="donut" width="250" :options="chartOptions" :series="chartSeries" />
          <div class="donut-title">Matchs Joués</div>
        </div>

        <!-- podium Keikokus -->
        <Podium title="Top Keikokus" :ranking="topKeikokus" />
      </div>

      <!-- temps des matchs -->
      <div class="match-time-stats" v-if="!loading && matches.length > 0">
        <div class="match-stat fastest">
          <p>⚡ Match le plus rapide</p>
          <strong>{{ fastestMatch.time }}</strong>
          <span>{{ fastestMatch.players }}</span>
        </div>

        <div class="match-stat average">
          <p>⏳ Temps moyen d'un match</p>
          <strong>{{ averageMatchTime }}</strong>
        </div>

        <div class="match-stat longest">
          <p>🐢 Match le plus long</p>
          <strong>{{ longestMatch.time }}</strong>
          <span>{{ longestMatch.players }}</span>
        </div>
      </div>
    </div>
    <div v-if="showQRModal" class="modal" @click.self="showQRModal = false">
      <div class="modal-content">
        <h4 style="padding-bottom: 10px;">Partager les statistiques</h4>
        <qrcode-vue :value="qrData" :size="350" level="H" />
        <button @click="showQRModal = false" class="close-button">Fermer</button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, watch, onMounted, computed } from "vue";
import VueApexCharts from "vue3-apexcharts";
import { getBracketByCategory } from '@/replicache/stores/Bracket/bracketStore';
import { getRoundsByBracket } from '@/replicache/stores/Bracket/roundStore';
import { getPoolManagerByCategory } from '@/replicache/stores/Pool/poolManagerStore';
import { getPoulesByPoolManagerId } from '@/replicache/stores/Pool/poolStore';
import { getMatchesByRound, getMatchesByPool } from '@/replicache/stores/matchStore';
import Podium from "./Podium.vue";
import QrcodeVue from 'qrcode.vue';
import { genders, categoriesTypes, categoriesAge, grades } from '@/replicache/models/constants.js';


defineOptions({ components: { apexchart: VueApexCharts, Podium } });

const props = defineProps({
  category: { type: Object, required: true },
  participants: { type: Array, required: true },
  tournamentId: {
    type: String,
    required: true,
  },
});

const showQRModal = ref(false);
const qrData = computed(() => {
  // fonction de formatage des podiums en s'assurant de ne pas renvoyer undefined
  const formatPodium = (podium) => {
    return podium.map(player => ({
      rank: player.rank ?? null,
      name: `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || null,
      score: player.score ?? null
    }));
  };

  // crea des infos détaillées de la catégorie
  const categoryDetails = {
    name: props.category.name ?? null,
    genre: (genders.find(g => g.id === String(props.category.genderId))?.nom) ?? props.category.genderId ?? null,
    type: (categoriesTypes.find(t => t.id === String(props.category.typeId))?.nom) ?? props.category.typeId ?? null,
    ageCategories: props.category.ageCategoryIds.map(id => {
      const cat = categoriesAge.find(a => a.id === String(id));
      return cat ? cat.nom : (id ?? null);
    }),
    minGrade: (grades.find(g => g.id === String(props.category.minGradeId))?.nom) ?? props.category.minGradeId ?? null,
    maxGrade: (grades.find(g => g.id === String(props.category.maxGradeId))?.nom) ?? props.category.maxGradeId ?? null,
    weightRange: props.category.weightRange ?? null
  };

  const data = {
    date: new Date().toLocaleDateString('fr-FR'),
    category: props.category.name ?? null,
    categoryDetails: categoryDetails,
    matches: {
      played: chartSeries.value[0] ?? null,
      total: matches.value?.length ?? null,
      pending: chartSeries.value[1] ?? null
    },
    timeStats: {
      average: averageMatchTime.value ?? null,
      fastest: {
        time: fastestMatch.value.time ?? null,
        players: fastestMatch.value.players ?? null
      },
      longest: {
        time: longestMatch.value.time ?? null,
        players: longestMatch.value.players ?? null
      }
    },
    ipponsPodium: formatPodium(topIppons.value) ?? null,
    keikokusPodium: formatPodium(topKeikokus.value) ?? null
  };

  return JSON.stringify(data);
});


const averageMatchTime = ref("00:00");
const fastestMatch = ref({ time: "00:00", players: "" });
const longestMatch = ref({ time: "00:00", players: "" });

function calculateMatchDurations() {
  const finishedMatches = matches.value.filter((match) => match.idWinner !== null);

  if (finishedMatches.length === 0) {
    averageMatchTime.value = "Non défini";
    fastestMatch.value = { time: "Non défini", players: "" };
    longestMatch.value = { time: "Non défini", players: "" };
    return;
  }

  const matchDurations = finishedMatches.map((match) => {
    const baseTime = 180 - match.timer.currentTime;
    const additionalTime = match.timer.additionalTime !== -1 ? (60 - match.timer.additionalTime) : 0;
    const totalTime = baseTime + additionalTime;

    const player1 = props.participants.find((p) => p.id === match.idPlayer1);
    const player2 = props.participants.find((p) => p.id === match.idPlayer2);
    const playerNames = player1 && player2 ? `${player1.firstName} ${player1.lastName} vs ${player2.firstName} ${player2.lastName}` : "Inconnu";

    return { totalTime, playerNames };
  });

  const totalDuration = matchDurations.reduce((sum, match) => sum + match.totalTime, 0);
  const avgTime = Math.round(totalDuration / matchDurations.length);
  const minMatch = matchDurations.reduce((a, b) => (a.totalTime < b.totalTime ? a : b));
  const maxMatch = matchDurations.reduce((a, b) => (a.totalTime > b.totalTime ? a : b));

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  averageMatchTime.value = formatTime(avgTime);
  fastestMatch.value = { time: formatTime(minMatch.totalTime), players: minMatch.playerNames };
  longestMatch.value = { time: formatTime(maxMatch.totalTime), players: maxMatch.playerNames };
}


const matches = ref([]);
const loading = ref(false);

const chartSeries = ref([]);
const chartOptions = ref({
  chart: { type: "donut" },
  labels: ["Matchs joués", "Matchs en attente"],
  colors: ["#4CAF50", "grey"],
  legend: { show: false },
  tooltip: { enabled: true, y: { formatter: (value) => `${value} matchs` } },
  plotOptions: { pie: { expandOnClick: false, donut: { size: "60%" } } },
});

// classement des meilleurs joueurs
const topIppons = ref([]);
const topKeikokus = ref([]);

async function fetchMatches() {
  loading.value = true;
  matches.value = [];

  // verif si la catégorie est un bracket (tournoi à élimination)
  if (props.category.typeId === 2) {

    const bracket = await getBracketByCategory(props.category.id);

    if (bracket) {
      const rounds = await getRoundsByBracket(bracket.id);

      for (const round of rounds) {
        const roundMatches = await getMatchesByRound(round.id);

        matches.value.push(...roundMatches);
      }
    }
  }
  // verif si la catégorie est un tournoi par poules
  else if (props.category.typeId === 1) {

    const poolManager = await getPoolManagerByCategory(props.category.id);

    if (poolManager) {
      const poules = await getPoulesByPoolManagerId(poolManager.id);

      for (const poule of poules) {
        const poolMatches = await getMatchesByPool(poule.id);

        matches.value.push(...poolMatches);
      }
    }
  }

  // verif si les joueurs existent et enlève les matchs "BYE"
  matches.value = matches.value.filter((match) => {
    const player1 = props.participants.find((p) => p.id === match.idPlayer1);
    const player2 = props.participants.find((p) => p.id === match.idPlayer2);

    // si un des joueurs a un ID -1, on exclut le match car c'est un match contre un BYE et il compte pas
    if (match.idPlayer1 === -1 || match.idPlayer2 === -1) {
      return false;
    }

    // on garde les matchs où un ou deux joueurs ont ID -2
    const hasPlayer1 = player1 || match.idPlayer1 === -2;
    const hasPlayer2 = player2 || match.idPlayer2 === -2;

    return hasPlayer1 && hasPlayer2;
  });

  // maj des données après récupération des matchs
  updateChartData();
  calculateTopPlayers();
  calculateMatchDurations();

  loading.value = false;
}


function updateChartData() {
  const totalMatches = matches.value.length;
  const playedMatches = matches.value.filter((match) => match.idWinner !== null).length;
  const pendingMatches = totalMatches - playedMatches;

  chartSeries.value = [playedMatches, pendingMatches];
}

// calcule les 3 meilleurs en Ippons et Keikokus
function calculateTopPlayers() {
  let ipponScores = {};
  let keikokuScores = {};

  props.participants.forEach((participant) => {
    const participantMatches = matches.value.filter(
      (match) => match.idPlayer1 === participant.id || match.idPlayer2 === participant.id
    );

    let ippons = participantMatches.reduce(
      (sum, match) =>
        sum + (match.idPlayer1 === participant.id ? match.ipponsPlayer1 : match.ipponsPlayer2),
      0
    );
    let keikokus = participantMatches.reduce(
      (sum, match) =>
        sum + (match.idPlayer1 === participant.id ? match.keikokusPlayer1 : match.keikokusPlayer2),
      0
    );

    if (ippons > 0) ipponScores[participant.id] = { ...participant, score: ippons };
    if (keikokus > 0) keikokuScores[participant.id] = { ...participant, score: keikokus };
  });

  // fonction pour classer les joueurs avec gestion des égalités
  const rankPlayers = (scores) => {
    const sortedPlayers = Object.values(scores).sort((a, b) => b.score - a.score);
    const rankedPlayers = [];
    const rankMap = new Map();

    let rank = 1;
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];

      // si le score est nouveau, on lui attribue une place dans le podium
      if (!rankMap.has(player.score)) {
        rankMap.set(player.score, rank);
        rank++;
      }

      // attribue la bonne position
      rankedPlayers.push({ ...player, rank: rankMap.get(player.score) });

      // arrete après avoir rempli le podium (max 3 places)
      if (rankMap.size >= 3) break;
    }

    return rankedPlayers;
  };

  // classement final
  topIppons.value = rankPlayers(ipponScores);
  topKeikokus.value = rankPlayers(keikokuScores);
}



onMounted(fetchMatches);
watch(() => props.category.id, fetchMatches);
</script>

<style scoped>
.category-stats {
  background: #ffffff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin: 0 auto;
}

.category-stats h3 {
  font-size: 22px;
  color: #1e3a5f;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  margin-bottom: 20px;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 25px;
  margin: 20px 0;
}

.donut-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-title {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  color: #1e3a5f;
  text-align: center;
}

.match-time-stats {
  display: flex;
  justify-content: space-between;
  background: #eef6ff;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.05);
}

.match-stat {
  text-align: center;
  flex: 1;
  padding: 10px;
}

.match-stat p {
  font-size: 14px;
  color: #0070d4;
  font-weight: bold;
}

.match-stat strong {
  font-size: 22px;
  color: #1e3a5f;
}

.match-stat span {
  font-size: 12px;
  color: #555;
  display: block;
  margin-top: 5px;
}

.qr-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.2s;
}

.qr-button:hover {
  background: #f0f0f0;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.close-button {
  margin-top: 20px;
  padding: 8px 16px;
  background: #1e3a5f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
