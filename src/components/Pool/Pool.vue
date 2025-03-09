<template>
  <div class="pool-container">
    <div class="pool-header">
      <h3>{{ pool.label }}</h3>
      <span class="badge">{{ pool.participants.length }} participants</span>
    </div>

    <div class="pool-content">
      <div class="pool-grid">
        <!-- Participants -->
        <div class="participants-list">
          <h4>Participants</h4>
          <ul>
            <li v-for="participant in pool.participants" :key="participant.id">
              <div class="avatar">{{ getInitials(participant) }}</div>
              <div class="info">
                <div>{{ participant.lastName }} {{ participant.firstName }}</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Classement -->
        <div class="standings">
          <h4>Classement</h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
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
                :class="getMedalClass(index)">
                <td>{{ index + 1 }}</td>
                <td>{{ standing.participant.lastName }}</td>
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

      <!-- Matchs de la poule -->
      <div class="matches">
        <h4>
          Matchs
          <span class="badge">
            {{ getCompletedMatchCount() }}/{{ pool.matches.length }}
          </span>
          <span v-if="pool.isComplete"> (terminée)</span>
        </h4>
        <div class="matches-grid">
          <div v-for="match in pool.matches" :key="match.idMatch" class="match-card"
            :class="{ 'completed': match.winner !== null }" @click="editMatch(match)">
            <div class="match-header">Match {{ match.idMatch.split('_')[1] }}</div>
            <div class="player" :class="{ 'winner': match.winner === match.player1.id }">
              {{ match.player1.lastName }}
              <span v-if="match.score1 !== null" class="score">{{ match.score1 }}</span>
              <span v-if="match.keikoku1 > 0" class="keikoku">{{ match.keikoku1 }}</span>
            </div>
            <div class="vs">vs</div>
            <div class="player" :class="{ 'winner': match.winner === match.player2.id }">
              {{ match.player2.lastName }}
              <span v-if="match.score2 !== null" class="score">{{ match.score2 }}</span>
              <span v-if="match.keikoku2 > 0" class="keikoku">{{ match.keikoku2 }}</span>
            </div>
            <div class="status" :class="match.winner ? 'finished' : 'pending'">
              {{ match.winner ? 'Terminé' : 'En attente' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pool',
  props: {
    pool: {
      type: Object,
      required: true
    }
  },
  computed: {
    sortedStandings() {
      // Les standings sont déjà triés dans updatePoolStandings (côté JS).
      return [...this.pool.standings];
    }
  },
  methods: {
    editMatch(match) {
      this.$emit('edit-match', match);
    },
    getInitials(participant) {
      if (!participant) return '';
      const lastName = participant.lastName || '';
      const firstName = participant.firstName || '';
      return (lastName.charAt(0) + (firstName.charAt(0) || '')).toUpperCase();
    },
    getCompletedMatchCount() {
      return this.pool.matches.filter(match => match.winner !== null).length;
    },
    getMedalClass(index) {
      if (index === 0) return 'gold';
      if (index === 1) return 'silver';
      if (index === 2) return 'bronze';
      return '';
    }
  }
}
</script>

<style scoped>
.pool-container {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.pool-header {
  background: linear-gradient(135deg, #4285f4, #346ac3);
  color: white;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-header h3 {
  margin: 0;
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.pool-content {
  padding: 15px;
}

.pool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

/* Participants */
.participants-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #eee;
  border-radius: 6px;
}

.participants-list li {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}

.participants-list li:last-child {
  border-bottom: none;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #4285f4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}

.info {
  flex-grow: 1;
}

/* Classement */
.standings table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #eee;
}

.standings th,
.standings td {
  padding: 8px;
  text-align: center;
}

.standings th {
  background: #f5f5f5;
  font-weight: 500;
}

.standings td {
  border-top: 1px solid #eee;
}

.standings td:nth-child(2) {
  text-align: left;
}

/* Médailles */
.gold {
  background: #fff9c4;
  /* jaune pale */
}

.silver {
  background: #f0f0f0;
  /* gris clair */
}

.bronze {
  background: #ffe0b2;
  /* orange très clair */
}

/* Matchs */
.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.match-card {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.match-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.match-card.completed {
  border-left: 4px solid #34a853;
}

.match-header {
  background: #f5f5f5;
  padding: 5px 10px;
  font-size: 0.8rem;
  color: #666;
}

.player {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player.winner {
  background: rgba(52, 168, 83, 0.08);
  font-weight: 500;
}

.vs {
  text-align: center;
  color: #999;
  font-size: 0.8rem;
}

.score {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.keikoku {
  background: #fbbc05;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-left: 5px;
}

.status {
  text-align: center;
  padding: 5px;
  font-size: 0.8rem;
  border-top: 1px solid #eee;
}

.status.finished {
  color: #34a853;
  font-weight: 500;
}

.status.pending {
  color: #e67e22;
  font-weight: 500;
}

@media (max-width: 768px) {
  .pool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
