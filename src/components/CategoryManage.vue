<template>
  <div class="category-manage">
    <!-- navbar avec onglets -->
    <VaNavbar color="#154EC1" class="h-24">
      <template #left>
        <VaNavbarItem class="logo">
          Gestion de catégorie : {{ props.category.name }}
        </VaNavbarItem>
      </template>
      <template #center>
        <VaTabs v-model="activeTab" color="#9FECFC">
          <VaTab color="#9FECFC" name="category">Catégorie</VaTab>
          <VaTab color="#9FECFC" name="statistics">Statistiques</VaTab>
        </VaTabs>
      </template>
      <template #right>
        <div>
          <va-button @click="showParticipants = !showParticipants" round icon="visibility" color="#ffffff">
            Afficher les Participants
          </va-button>
          <ParticipantList v-if="showParticipants" @find-participant="searchParticipant = $event"
            :participants="participants" @close="showParticipants = !showParticipants" />
        </div>
      </template>
    </VaNavbar>

    <!-- contenu des onglets -->
    <div class="tab-content">
      <!-- cnglet "Catégorie" -->
      <div v-if="activeTab === 'category'">

        <!-- chargement dynamique des composants -->
        <component v-if="participants.length > 0" :is="categoryComponent" :key="categoryKey"
          :tournamentId="props.tournamentId" :category="props.category" :participants="participants"
          @update="fetchParticipants()" :searchParticipant="searchParticipant" />

      </div>

      <!-- onglet "stats" -->
      <div v-else-if="activeTab === 'statistics'">
        <CategoryStatistics :tournamentId="props.tournamentId" :category="props.category" />
      </div>
    </div>
  </div>
</template>
  
  
  <script setup>
  import { ref, watch, onMounted, computed } from "vue";
  import { getParticipantsByCategory } from "@/replicache/stores/participantStore"; 
  
  // importation des composants conditionnels
  import BracketType from "@/components/Bracket/BracketType.vue";
  import PoolList from "@/components/Pool/PoolList.vue";
  import CategoryStatistics from "@/components/CategoryStatistics.vue";
  import ParticipantList from "./Bracket/ParticipantsList.vue";
  
  const props = defineProps({
    category: {
      type: Object,
      required: true,
    },
    tournamentId: {
      type: String,
      required: true,
    },
  });
  

  const showParticipants = ref(false);

  const searchParticipant = ref(null); // participant selectionné pour le redirigé vers l ancre dans le tab
  
  const activeTab = ref("category"); // onglet actif par défaut
  const participants = ref([]); // liste des participants

  const categoryKey = computed(() => `${props.category.id}-${participants.value.length}`);
  
  // choisir le bon composant en fonction du type de catégorie
  const categoryComponent = computed(() => {
    if (!props.category || !props.category.typeId) return null;
    return props.category.typeId === 1 ? PoolList : BracketType;
  });
  
  // fonction pour recup les participants de la catégorie
  const fetchParticipants = async () => {
    if (!props.category.id || !props.tournamentId) return;
    try {
      participants.value = await getParticipantsByCategory(props.tournamentId, props.category.id);
    } catch (error) {
      console.error("Erreur lors de la récupération des participants :", error);
    }
  };
  
  // chg les participants au montage et si la catégorie change
  onMounted(fetchParticipants);
  watch(() => props.category.id, fetchParticipants);
  </script>
  
  
  
  <style scoped>
  .category-manage {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .va-navbar {
    padding: 12px;
  }
  
  .logo {
    font-weight: 600;
    font-size: 1.5rem;
  }
  
  .tab-content {
    flex: 1;
    padding: 5px;
    background: #ffffff;
  }
  
  </style>