<template>
  <!-- on englobe toute la vue dans un conteneur qui scrolle -->
  <div class="pool-list-scroll">
    <h2 class="main-title">Gestion multiphase des poules</h2>

    <!-- loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Génération des poules...</p>
    </div>

    <div v-else-if="phases.length === 0" class="empty-state">
      <p>Aucune poule générée</p>
    </div>

    <!-- affichage normal des phases -->
    <div v-else>
      <div
        v-for="(phase, phaseIndex) in phases"
        :key="`phase_${phaseIndex}`"
        class="phase-block"
      >
        <h2>{{ phase.label }}</h2>

        <div class="pools-grid">
          <Pool
            v-for="(pool, idx) in phase.pools"
            :key="`pool_${phaseIndex}_${idx}`"
            :pool="pool"
            @edit-match="showMatchEditor"
            :refresh-matches="refreshMatches"
          />
        </div>

        <!-- bouton "générer la phase suivante" -->
        <div
          v-if="phaseIndex === phases.length - 1 && phase.pools.length > 1"
          class="final-phase"
        >
          <hr />
          <button class="btn primary large" @click="generateNextPhase">
            Générer la phase suivante (vainqueurs)
          </button>
        </div>
      </div>
    </div>

    <!-- matchmodal.vue (scoreboard) -->
    <MatchModal
      v-if="matchEditorOpen"
      :matchId="currentMatchId"
      @close="closeMatchEditor"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Pool from './Pool.vue';
import MatchModal from '@/components/MatchModal.vue';
import { poolManagerService } from '@/replicache/services/Pool/poolManagerService';
import { getPoolManagerByCategory } from '@/replicache/stores/Pool/poolManagerStore'
import { getPoulesByPoolManagerId } from '@/replicache/stores/Pool/poolStore'
import { poolService } from '@/replicache/services/Pool/poolService';
import { generateFinalistPool } from '@/functions/generatePools';

const props = defineProps({
  participants: {
    type: Array,
    required: true,
  },
  category: {
    type: Object,
    required: true,
  },
});

const loading = ref(false);
const phases = ref([]);
const poolManagerId = ref(null);

// pour la matchmodal.vue
const matchEditorOpen = ref(false);
const currentMatchId = ref(null);

/* charge ou cree un poolmanager et recupere les phases */
const loadOrCreatePoolManager = async () => {
  loading.value = true;
  try {
    // verifie si un poolmanager existe deja pour cette categorie
    const existingPoolManager = await getPoolManagerByCategory(props.category.id);

    if (existingPoolManager) {
      poolManagerId.value = existingPoolManager.id;
    } else {
      // cree un nouveau poolmanager si aucun n'existe
      poolManagerId.value = await poolManagerService.create(props.category.id, props.participants);
    }

    // recupere les poules du poolmanager
    const poules = await getPoulesByPoolManagerId(poolManagerId.value);

    // structure les phases
    phases.value = [
      {
        label: 'Phase 1 (Poules initiales)',
        pools: poules,
      },
    ];
  } catch (error) {
    console.error('Erreur lors du chargement des poules:', error);
    alert('Erreur lors du chargement des poules');
  } finally {
    loading.value = false;
  }
};

/* genere la phase suivante avec les vainqueurs des poules actuelles */
const generateNextPhase = async () => {
  const lastIndex = phases.value.length - 1;
  const lastPhase = phases.value[lastIndex];

  if (lastPhase.pools.length <= 1) {
    alert('Une seule poule => pas de phase suivante possible.');
    return;
  }

  const allDone = lastPhase.pools.every((p) => p.isComplete);
  if (!allDone) {
    alert('Toutes les poules de la phase précédente doivent être terminées.');
    return;
  }

  // genere la phase suivante avec les vainqueurs
  const nextPools = generateFinalistPool(lastPhase.pools, 1);

  // cree les nouvelles poules dans replicache
  for (const pool of nextPools) {
    await poolService.create({
      poolManagerId: poolManagerId.value,
      label: pool.label,
      participants: pool.participants,
      qualifyingPositions: pool.qualifyingPositions,
    });

    // cree les matchs de la nouvelle poule
    for (const match of pool.matches) {
      await matchService.create({
        idMatch: match.idMatch,
        idPoule: pool.id,
        idPlayer1: match.player1 ? match.player1.id : -2,
        idPlayer2: match.player2 ? match.player2.id : -2,
        score1: match.score1,
        score2: match.score2,
        winner: match.winner,
        keikoku1: match.keikoku1,
        keikoku2: match.keikoku2,
      });
    }
  }

  // ajoute la nouvelle phase a l'affichage
  const newPhaseNumber = phases.value.length + 1;
  phases.value.push({
    label: `Phase ${newPhaseNumber}`,
    pools: nextPools,
  });
};

/* ouvre la modale d'edition de match */
const showMatchEditor = (match) => {
  currentMatchId.value = match.idMatch;
  matchEditorOpen.value = true;
};

const refreshMatches = ref(0);
/* ferme la modale */
const closeMatchEditor = () => {
  matchEditorOpen.value = false;
  currentMatchId.value = null;
  refreshMatches.value++;
};

// charge les donnees au montage du composant
onMounted(() => {
  loadOrCreatePoolManager();
});
</script>


<style scoped>
/* --- conteneur global qui scrolle sur toute la page (width 100%) --- */
.pool-list-scroll {
  width: 100%;
  height: 80vh;
  overflow-y: auto;
  padding: 1rem;
  box-sizing: border-box;
  background: #f8f9fa;
}

.main-title {
  margin: 0 0 1rem 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(66, 133, 244, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 40px;
  margin-bottom: 20px;
}

.phase-block {
  margin-bottom: 40px;
}

.pools-grid {
  display: grid;
  gap: 20px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 1rem;
}

.btn:hover {
  background: #e9ecef;
}

.btn.primary {
  background: #4285f4;
  color: white;
  border-color: #3367d6;
}

.btn.primary:hover {
  background: #3367d6;
}

.btn.large {
  padding: 10px 20px;
}

.final-phase {
  text-align: center;
  margin-top: 20px;
}
</style>