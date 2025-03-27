<template>
  <div class="pool-list-scroll" ref="poolListScroll">
    <!-- loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Génération des poules...</p>
    </div>

    <!-- aucune poule générée -->
    <div v-else-if="phases.length === 0" class="empty-state">
      <p>Aucune poule générée</p>
    </div>

    <!-- affichage des phases -->
    <!-- affichage des poules initiales -->
    <div v-if="phases?.length > 1 || phases[0]?.pools?.length > 1">
      <h2 style="margin-bottom: 10px;">Poules Initiales</h2>
      <div v-for="(phase, phaseIndex) in phases" :key="`phase_${phaseIndex}`" class="phase-block">
        <div class="pools-grid">
          <Pool v-for="(pool, idx) in filteredPools(phase.pools)" :key="`pool_${phaseIndex}_${idx}`" :pool="pool"
            @edit-match="showMatchEditor" :refresh-matches="refreshMatches"
            :search-participant="props.searchParticipant" :participants="props.participants" />
        </div>
      </div>
    </div>

    <!-- affichage de la poule finale -->
    <div v-if="finalPool" class="final-pool-container">
      <h2 class="final-pool-title">🏆 Poule Finale 🏆</h2>
      <Pool :pool="finalPool" class="final-pool" @edit-match="showMatchEditor" :refresh-matches="refreshMatches"
        :search-participant="props.searchParticipant" :participants="props.participants" />
    </div>


    <!-- modal du match -->
    <MatchModal v-if="matchEditorOpen" :matchId="currentMatchId" @close="closeMatchEditor" />
  </div>
  <canvas id="minimap"></canvas>
</template>

<script setup>
import { ref, onMounted, computed, watchEffect, nextTick } from 'vue';
import Pool from './Pool.vue';
import MatchModal from '@/components/MatchModal.vue';
import { poolManagerService } from '@/replicache/services/Pool/poolManagerService';
import { getPoolManagerByCategory } from '@/replicache/stores/Pool/poolManagerStore';
import { getPoulesByPoolManagerId } from '@/replicache/stores/Pool/poolStore';
import { matchService } from "@/replicache/services/matchService";
import { getMatchesByPool } from "@/replicache/stores/matchStore";
import pagemap from 'pagemap';

const props = defineProps({
  participants: {
    type: Array,
    required: true,
  },
  category: {
    type: Object,
    required: true,
  },
  searchParticipant: {
    type: Object,
    default: null,
  },
});

const loading = ref(false);
const phases = ref([]);
const poolManagerId = ref(null);
const matchEditorOpen = ref(false);
const currentMatchId = ref(null);
const refreshMatches = ref(0);

// charge ou crée un poolmanager et récupère les phases
const loadOrCreatePoolManager = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const existingPoolManager = await getPoolManagerByCategory(props.category.id);

    if (existingPoolManager) {
      poolManagerId.value = existingPoolManager.id;
    } else {
      poolManagerId.value = await poolManagerService.createPoolManager(props.category.id, props.participants);
    }

    const poules = await getPoulesByPoolManagerId(poolManagerId.value);

    poules.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, ""), 10);
      const numB = parseInt(b.label.replace(/\D/g, ""), 10);
      return numA - numB;
    });

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

const finalPool = computed(() => {
  if (!phases.value.length || !phases.value[0]?.pools?.length) {
    return null;
  }

  // si une seule poule existe, elle est automatiquement la poule finale
  if (phases.value[0].pools.length === 1) {
    return phases.value[0].pools[0];
  }

  // sinnon, on cherche une poule nommée "Poule Finale"
  return phases.value.flatMap(phase => phase.pools).find(pool => pool.label === "Poule Finale") || null;
});


const filteredPools = (pools) => {
  if (!pools) return [];

  // si une seule poule existe, elle est déjà affichée en tant que poule finale
  if (pools.length === 1) return [];

  return pools.filter(pool => pool?.label !== "Poule Finale");
};


const showMatchEditor = (match) => {
  currentMatchId.value = match.idMatch;
  matchEditorOpen.value = true;
};

const closeMatchEditor = () => {
  matchEditorOpen.value = false;
  currentMatchId.value = null;
  refreshMatches.value++;
  loadOrCreatePoolManager();
};

const poolListScroll = ref(null); // ref au conteneur scrollable

onMounted(async () => {
  await loadOrCreatePoolManager();

  // Attendre que le DOM soit mis à jour
  await nextTick();

  // Initialiser pagemap après que le contenu est rendu
  if (poolListScroll.value) {
    pagemap(document.querySelector('#minimap'), {
      viewport: poolListScroll.value,
      styles: {
        '.pool-container': 'rgba(210, 210, 210, 0.5)', // Couleur pour la poule finale
        '.match-card': 'rgba(203, 203, 255, 0.5)', // Couleur pour la poule finale
        '.standings': 'rgba(210, 210, 210, 0.9)', // Couleur pour la poule finale
      },
      back: 'rgba(240, 240, 240, 1)',
      view: 'rgba(0, 0, 0, 0.2)',
      drag: 'rgba(0, 0, 0, 0.2)',
      interval: 1,
    });

  }
});


// verif si toutes les poules initiales sont terminées
const allPoolsComplete = computed(() => {
  if (!phases.value.length || !phases.value[0]?.pools?.length) return false;

  return phases.value[0].pools
    .filter(pool => pool?.label !== "Poule Finale")
    .every(pool => pool.isComplete);
});

// genere les matchs de la poule finale
watchEffect(async () => {
  if (allPoolsComplete.value && finalPool.value) {
    try {
      const existingMatches = await getMatchesByPool(finalPool.value.id);

      if (existingMatches.length > 0) {
        return;
      }

      await matchService.generatePoolFinalMatchs(
        poolManagerId.value,
        finalPool.value.id,
        finalPool.value.participants,
      );

      refreshMatches.value++;
      loadOrCreatePoolManager();
    } catch (error) {
      console.error("Erreur lors de la génération des matchs de la poule finale :", error);
    }
  }
});
</script>


<style scoped>
/* --- conteneur global qui scrolle sur toute la page (width 100%) --- */
.pool-list-scroll {
  width: 100%;
  height: 75vh;
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

.stepper-container {
  position: sticky;
  top: 0;
  z-index: 2;
  background: white;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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
  background: white;
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

.final-pool-container {
  margin-top: 40px;
  padding: 1ch;
  border: 3px solid #d4af37;
  border-radius: 12px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.final-pool-title {
  color: #b8860b;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.final-pool {
  border: 2px solid #b8860b;
  background: #fffaf0;
  padding: 10px;
  border-radius: 10px;
}

#minimap {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 100px;
  height: 200px;
  z-index: 5;
  border: 1px solid rgba(0, 28, 42, 1);
  background-color: rgba(240, 240, 240, 1);
}
</style>
