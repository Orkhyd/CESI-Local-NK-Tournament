<template>
  <div class="category-manage">
    <!-- navbar avec onglets -->
    <VaNavbar color="#0c2432" class="h-24">
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
        <div v-if="activeTab !== 'statistics'">
          <va-button @click="exportToPDF" round icon="picture_as_pdf" color="#ffffff" class="mr-2">
            Exporter en PDF
          </va-button>
          <!-- cache le bouton si on est sur la partie statistiques de la catégoorie -->
          <va-button @click="showParticipants = !showParticipants" round icon="visibility" color="#ffffff">
            Afficher les Participants
          </va-button>
          <ParticipantsCategoryList v-if="showParticipants" @find-participant="searchParticipant = $event"
            :participants="participants" @close="showParticipants = !showParticipants" />
        </div>
      </template>
    </VaNavbar>

    <!-- contenu des onglets -->
    <div class="tab-content">
      <!-- cnglet "Catégorie" -->
      <div v-if="activeTab === 'category'">

        <!-- chargement dynamique des composants -->
        <component v-if="isParticipantsLoaded" :is="categoryComponent" :key="categoryKey"
          :tournamentId="props.tournamentId" :category="props.category" :participants="participants"
          :searchParticipant="searchParticipant" />
      </div>

      <!-- onglet "stats" -->
      <div v-else-if="activeTab === 'statistics'">
        <CategoryStatistics v-if="isParticipantsLoaded" :category="props.category" :participants="participants" />
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { getParticipantsByCategory, rep as participantRep } from "@/replicache/stores/participantStore";

// importation des composants conditionnels
import BracketType from "@/components/Bracket/BracketType.vue";
import PoolList from "@/components/Pool/PoolList.vue";
import CategoryStatistics from "@/components/Statistics/CategoryStatistics.vue";
import ParticipantsCategoryList from "./Bracket/ParticipantsCategoryList.vue";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";


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

// fonction pour generer le pd


const showParticipants = ref(false);

const searchParticipant = ref(null); // participant selectionné pour le redirigé vers l ancre dans le tab

const activeTab = ref("category"); // onglet actif par défaut
const participants = ref([]); // liste des participants
const participantsLoad = ref([]); // liste des participants

const categoryKey = computed(() => `${props.category.id}-${participants.value.length}`);

// choisir le bon composant en fonction du type de catégorie
const categoryComponent = computed(() => {
  if (!props.category || !props.category.typeId) return null;
  return props.category.typeId === 1 ? PoolList : BracketType;
});

const isParticipantsLoaded = ref(false); // var pour vérifier si les participants sont bien chargés


// fonction pour recup les participants de la catégorie
const fetchParticipants = async () => {
  if (!props.category.id || !props.tournamentId) return;

  isParticipantsLoaded.value = false; // on indique que les données sont en train d’être chargées
  try {
    participantsLoad.value = await getParticipantsByCategory(props.tournamentId, props.category.id);
    participants.value = participantsLoad.value;
    isParticipantsLoaded.value = true; // on indique que les participants sont bien chargés
  } catch (error) {
    console.error("Erreur lors de la récupération des participants :", error);
  }
};


watch(activeTab, (newTab) => {
  if (newTab === "statistics") {
    showParticipants.value = false; // ferme la liste des participants
  }
});

// chg les participants au montage et si la catégorie change
let unsubscribeParticipants; // variable pour stocker la fonction de désabonnement

onMounted(async () => {
  await fetchParticipants();

  // s'abonner aux changements dans les participants de la catégorie actuelle
  unsubscribeParticipants = participantRep.subscribe(
    async (tx) => {
      // scanner tous les participants
      const entries = await tx.scan({ prefix: "participant/" }).entries().toArray();
      return entries;
    },
    () => {
      // dès qu'un changement est détecté, rafraîchir la liste
      fetchParticipants();
    }
  );

});

onUnmounted(() => {
  if (unsubscribeParticipants) {
    unsubscribeParticipants();
  }
});

const pdfClass = computed(() => {
  if (!props.category || !props.category.typeId) return null;
  return props.category.typeId === 1 ? '.pool-pdf' : '.bracket';
});

const exportToPDF = async () => {
  try {
    // elément à exporter
    const element = document.querySelector(pdfClass.value);
    if (!element) {
      console.error("Élément PDF non trouvé");
      return;
    }

    // config
    const canvas = await html2canvas(element, {
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scale: 1,
      useCORS: true,
      allowTaint: true
    });

    // Calcalculeculer les dimensions du PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${props.category.name}_bracket.pdf`);

  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
  }
};

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