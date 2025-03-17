<template>
  <!-- on englobe toute la vue dans un conteneur qui scrolle -->
  <div class="pool-list-scroll">

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
      <div v-for="(phase, phaseIndex) in phases" :key="`phase_${phaseIndex}`" class="phase-block">
        <h2 style="margin-bottom: 5px;">{{ phase.label }}</h2>
        <div class="pools-grid">
          <Pool v-for="(pool, idx) in filteredPools(phase.pools)" :key="`pool_${phaseIndex}_${idx}`" :pool="pool"
            @edit-match="showMatchEditor" :refresh-matches="refreshMatches"
            :search-participant="props.searchParticipant" :participants="props.participants" />
        </div>


      </div>

      <!-- Affichage de la Poule Finale si elle existe -->
      <div v-if="finalPool" class="final-pool-container">
        <h2 class="final-pool-title">🏆 Poule Finale de Classement 🏆</h2>
        <Pool :pool="finalPool" class="final-pool" @edit-match="showMatchEditor" :refresh-matches="refreshMatches"
          :search-participant="props.searchParticipant" :participants="props.participants" />
      </div>

    </div>

    <!-- modal du match  -->
    <MatchModal v-if="matchEditorOpen" :matchId="currentMatchId" @close="closeMatchEditor" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue';
import Pool from './Pool.vue';
import MatchModal from '@/components/MatchModal.vue';
import { poolManagerService } from '@/replicache/services/Pool/poolManagerService';
import { getPoolManagerByCategory } from '@/replicache/stores/Pool/poolManagerStore'
import { getPoulesByPoolManagerId, rep } from '@/replicache/stores/Pool/poolStore'

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
  }
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
  if (!phases.value.length || !phases.value[0]?.pools) return null;
  return phases.value[0].pools.find(pool => pool.label === "Poule Finale") || null;
});

const filteredPools = (pools) => {
  if (!pools) return [];
  console.log(pools.filter(pool => pool?.label !== "Poule Finale"))
  return pools.filter(pool => pool?.label !== "Poule Finale");
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
  loadOrCreatePoolManager();
};

// charge les donnees au montage du composant
onMounted(() => {
  loadOrCreatePoolManager();
});

const allPoolsComplete = computed(() => {
  if (!phases.value.length || !phases.value[0]?.pools?.length) return false;

  return phases.value[0].pools
    .filter(pool => pool?.label !== "Poule Finale")
    .every(pool => pool.isComplete);
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

/* Conteneur spécifique pour la Poule Finale */
.final-pool-container {
  margin-top: 40px;
  padding: 20px;
  background: #f9f5dc; /* Couleur dorée claire */
  border: 3px solid #d4af37; /* Bordure dorée */
  border-radius: 12px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* Titre de la Poule Finale */
.final-pool-title {
  color: #b8860b;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
  text-transform: uppercase;
}

/* Style spécial pour la Poule Finale */
.final-pool {
  border: 2px solid #b8860b; /* Doré foncé */
  background: #fffaf0; /* Fond beige clair */
  padding: 15px;
  border-radius: 10px;
}

</style>