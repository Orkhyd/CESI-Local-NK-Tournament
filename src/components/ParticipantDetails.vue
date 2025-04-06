<template>
  <div class="card-container">
    <!-- participant -->
    <div class="participant-card">
      <div class="participant-header">
        <div class="gender-icon">
          <span v-if="participant.genderId == 1">👨</span>
          <span v-else-if="participant.genderId == 2">👩</span>
          <span v-else>👤</span>
        </div>
        <div class="participant-info">
          <h2>{{ participant.firstName }} {{ participant.lastName }}</h2>
          <ul>
            <li>
              <strong>Nationalité :</strong>
              {{ nationalityData ? nationalityData.name : 'Inconnue' }}
              <img v-if="nationalityData" :src='getFlag(nationalityData)' alt="Drapeau"
                class="flag" />
            </li>
            <li>
              <strong>Date de naissance :</strong>
              {{ formatDate(participant.birthDate) }} ({{ age }} ans)
            </li>
            <li><strong>Ceinture :</strong> {{ gradeName }}</li>
            <li><strong>Club :</strong> {{ participant.clubName }}</li>
            <li><strong>Poids :</strong> {{ participant.weight }} kg</li>
          </ul>
        </div>
      </div>

      <!-- statistiques -->
      <div class="statistics">
        <h3>Statistiques</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="label">Matchs joués</span>
            <span class="value">{{ filteredMatches.length }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Gagnés</span>
            <span class="value">{{ totalWins }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Perdus</span>
            <span class="value">{{ totalLosses }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Ippons marqués</span>
            <span class="value">{{ totalIpponsScored }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Ippons concédés</span>
            <span class="value">{{ totalIpponsConceded }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Keikokus faits</span>
            <span class="value">{{ totalKeikokusGiven }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Keikokus reçus</span>
            <span class="value">{{ totalKeikokusReceived }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Temps moyen</span>
            <span class="value">{{ averageMatchTime }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Match le plus rapide</span>
            <span class="value">{{ fastestMatch.time }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Match le plus long</span>
            <span class="value">{{ longestMatch.time }}</span>
          </div>
        </div>
      </div>

      <div class="matches-section">
        <h3>Matchs</h3>
        <div v-if="filteredMatches.length === 0" class="no-matches">
          Aucun match joué
        </div>
        <div v-else class="matches-scroll">
          <div class="match-card" v-for="match in filteredMatches" :key="match.idMatch">
            <div class="match-header">
              <!-- joueur 1  -->
              <div class="player left">
                <div class="player-name">
                  <span class="player-lastname"
                    :class="{ 'player-lastname-highlight': match.idPlayer1 === participant.id }">
                    {{ getPlayerLastName(match.idPlayer1) }}
                  </span>
                  <span class="player-firstname">{{ getPlayerFirstName(match.idPlayer1) }}</span>
                </div>
                <div class="score">
                  <span class="keikoku" title="Ippon(s)">{{ match.keikokusPlayer1 }} K</span>
                  <span class="ippon" title="Keikoku(s)">{{ match.ipponsPlayer1 }} IP</span>
                </div>
              </div>

              <!-- VS  -->
              <div class="versus">
                <span>VS</span>
              </div>

              <!-- joueur 2 -->
              <div class="player right" :class="{ 'highlight-player': match.idPlayer2 === participant.id }">
                <div class="player-name">
                  <span class="player-lastname"
                    :class="{ 'player-lastname-highlight': match.idPlayer2 === participant.id }">
                    {{ getPlayerLastName(match.idPlayer2) }}
                  </span>
                  <span class="player-firstname">{{ getPlayerFirstName(match.idPlayer2) }}</span>
                </div>
                <div class="score">
                  <span class="ippon" title="Ippon(s)">{{ match.ipponsPlayer2 }} IP</span>
                  <span class="keikoku" title="Keikoku(s)">{{ match.keikokusPlayer2 }} K</span>
                </div>
              </div>
            </div>

            <!-- match (temps et résultat) -->
            <div class="match-body">
              <div class="match-time">
                <span>{{ formatTime(getMatchDuration(match)) }}</span>
              </div>
              <div class="match-result">
                <span v-if="match.idWinner === participant.id" class="result win">Gagné</span>
                <span v-else class="result lose">Perdu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getMatchesByParticipant } from '@/replicache/stores/matchStore';
import { grades, nationality } from '@/replicache/models/constants';
import { useCountryFlags } from '@/utils/countryFlags';

const { getFlag } = useCountryFlags();

const props = defineProps({
  participant: { type: Object, required: true },
  participants: { type: Array, required: true }
});

const matches = ref([]);

const filteredMatches = computed(() =>
  matches.value.filter(match =>
    match.idWinner !== null && match.idPlayer1 !== -1 && match.idPlayer2 !== -1
  )
);


const totalWins = computed(() =>
  filteredMatches.value.filter(match => match.idWinner === props.participant.id).length
);

const totalLosses = computed(() => filteredMatches.value.length - totalWins.value);

const totalIpponsScored = computed(() =>
  filteredMatches.value.reduce(
    (sum, match) =>
      sum + (match.idPlayer1 === props.participant.id ? match.ipponsPlayer1 : match.ipponsPlayer2),
    0
  )
);

const totalIpponsConceded = computed(() =>
  filteredMatches.value.reduce(
    (sum, match) =>
      sum + (match.idPlayer1 === props.participant.id ? match.ipponsPlayer2 : match.ipponsPlayer1),
    0
  )
);

const totalKeikokusGiven = computed(() =>
  filteredMatches.value.reduce(
    (sum, match) =>
      sum + (match.idPlayer1 === props.participant.id ? match.keikokusPlayer1 : match.keikokusPlayer2),
    0
  )
);

const totalKeikokusReceived = computed(() =>
  filteredMatches.value.reduce(
    (sum, match) =>
      sum + (match.idPlayer1 === props.participant.id ? match.keikokusPlayer2 : match.keikokusPlayer1),
    0
  )
);

const averageMatchTime = computed(() => {
  if (filteredMatches.value.length === 0) return "Non défini";
  const totalDuration = filteredMatches.value.reduce(
    (sum, match) => sum + getMatchDuration(match),
    0
  );
  return formatTime(Math.round(totalDuration / filteredMatches.value.length));
});

const fastestMatch = computed(() => {
  if (filteredMatches.value.length === 0) return { time: "Non défini" };
  return { time: formatTime(Math.min(...filteredMatches.value.map(getMatchDuration))) };
});

const longestMatch = computed(() => {
  if (filteredMatches.value.length === 0) return { time: "Non défini" };
  return { time: formatTime(Math.max(...filteredMatches.value.map(getMatchDuration))) };
});

// age à partir de la date de naissance
const age = computed(() => {
  const birth = new Date(props.participant.birthDate);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// recup du nom de ceinture depuis l'id
const gradeName = computed(() => {
  const grade = grades.find(g => g.id === String(props.participant.gradeId || ""));
  return grade ? grade.nom : 'Inconnu';
});

// recup des données de nationalité
const nationalityData = computed(() => {
  const nat = nationality.find(n => n.id === Number(props.participant.nationalityId));
  return nat || null;
});

//  formater la date de naissance
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
}

// formater le temps en mm:ss
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

//  acalcul de la durée d'un match
function getMatchDuration(match) {
  if (!match.timer) return 0;

  let totalTime = 180 - match.timer.currentTime; // temps écoulé en temps réglementaire

  if (match.timer.additionalTime !== -1) {
    totalTime += (60 - match.timer.additionalTime); // ajouter le temps additionnel écoulé
  }

  return totalTime;
}


// fnc pour obtenir le prénom du joueur à partir de son ID
function getPlayerFirstName(playerId) {
  if (playerId === props.participant.id) {
    return props.participant.firstName;
  }
  const player = props.participants.find(p => p.id === playerId);
  return player ? player.firstName : "Inconnu";
}

// fnc pour obtenir le nom de famille du joueur à partir de son ID
function getPlayerLastName(playerId) {
  if (playerId === props.participant.id) {
    return props.participant.lastName;
  }
  const player = props.participants.find(p => p.id === playerId);
  return player ? player.lastName : "Inconnu";
}



async function fetchParticipantMatches() {
  if (!props.participant || !props.participant.id) return;
  matches.value = await getMatchesByParticipant(props.participant.id);
}

onMounted(fetchParticipantMatches);
watch(() => props.participant, fetchParticipantMatches, { immediate: true });
</script>

<style scoped>
.card-container {
  margin: 0 auto;
  padding: 20px;
}

/* participant */
.participant-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
}

.participant-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.gender-icon {
  font-size: 3em;
  margin-right: 20px;
}

.participant-info h2 {
  margin: 0 0 10px 0;
  color: #007BFF;
}

.participant-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.participant-info li {
  margin-bottom: 5px;
  font-size: 0.95em;
  color: #333;
}

.flag {
  width: 20px;
  height: auto;
  margin-left: 5px;
  vertical-align: middle;
}

/* statistiques */
.statistics {
  margin-bottom: 30px;
}

.statistics h3 {
  color: #007BFF;
  margin-bottom: 15px;
  text-align: left;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.stat-item {
  background: #e6f0ff;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: 0.85em;
  color: #555;
  margin-bottom: 5px;
}

.stat-item .value {
  font-size: 1.2em;
  color: #007BFF;
  font-weight: bold;
}


/*  matchs */
.matches-section {
  margin-top: 30px;
}

.matches-section h3 {
  color: #007BFF;
  font-size: 1.5em;
  margin-bottom: 20px;
  text-align: left;
  border-bottom: 1px solid #007BFF;
  padding-bottom: 10px;
}

.matches-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.match-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 15px;
  min-width: 270px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.match-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.player {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.3s;
}

.player.left {
  align-items: flex-start;
}

.player.right {
  align-items: flex-end;
}

.player-name {
  display: flex;
  flex-direction: column;
  align-items: inherit;
}

.player-lastname {
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}

.player-lastname-highlight {
  color: #007BFF;
}

.player-firstname {
  font-size: 0.8em;
  color: #555;
  margin-top: 2px;
}

.score {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.ippon,
.keikoku {
  font-size: 0.9em;
  padding: 3px 6px;
  border-radius: 12px;
}

.ippon {
  background: #d4edda;
  color: #28a745;
}

.keikoku {
  background: #f8d7da;
  color: #dc3545;
}

.versus {
  width: 50px;
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  color: #007BFF;
}

.match-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.match-time {
  font-size: 0.9em;
  color: #555;
}

.match-result .result {
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.9em;
}

.result.win {
  background: #d4edda;
  color: #28a745;
}

.result.lose {
  background: #f8d7da;
  color: #dc3545;
}

.no-matches {
  text-align: center;
  font-size: 1.2em;
  color: #555;
  font-weight: bold;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #e0e0e0;
}
</style>
