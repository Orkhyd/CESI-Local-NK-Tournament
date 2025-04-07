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
          <VaButton @click="exportToPDF" round icon="picture_as_pdf" color="#ffffff" class="mr-2">
            Exporter en PDF
          </VaButton>
          <!-- cache le bouton si on est sur la partie statistiques -->
          <VaButton @click="showParticipants = !showParticipants" round icon="visibility" color="#ffffff">
            Afficher les Participants
          </VaButton>
          <ParticipantsCategoryList v-if="showParticipants" @find-participant="searchParticipant = $event"
            :participants="participants" @close="showParticipants = !showParticipants" />
        </div>
      </template>
    </VaNavbar>

    <!-- contenu des onglets -->
    <div class="tab-content">
      <!-- onglet "Catégorie" -->
      <div v-if="activeTab === 'category'">
        <!-- chargement dynamique des composants -->
        <component v-if="isParticipantsLoaded" :is="categoryComponent" :key="categoryKey"
          :tournamentId="props.tournament.id" :category="props.category" :participants="participants"
          :searchParticipant="searchParticipant" />
      </div>

      <!-- onglet "stats" -->
      <div v-else-if="activeTab === 'statistics'">
        <CategoryStatistics v-if="isParticipantsLoaded" :tournamentId="props.tournament.id" :category="props.category"
          :participants="participants" />
      </div>
    </div>

    <!-- modal de chargement pendant l'export PDF -->
    <VaModal v-model="isImporting" hide-default-actions class="loading-modal" no-esc-dismiss="true"
      no-outside-dismiss="true">
      <VaInnerLoading :loading="true">
        <div class="loading-content">
          <br><br><br><br>
          <p class="loading-text">Exportation du PDF en cours...</p>
        </div>
      </VaInnerLoading>
    </VaModal>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from "vue";
import { getParticipantsByCategory } from "@/replicache/stores/participantStore";

// importation des composants conditionnels
import BracketType from "@/components/Bracket/BracketType.vue";
import PoolList from "@/components/Pool/PoolList.vue";
import CategoryStatistics from "@/components/Statistics/CategoryStatistics.vue";
import ParticipantsCategoryList from "./Bracket/ParticipantsCategoryList.vue";
import { replicacheInstance as rep } from "@/replicache/replicache";

import { categoriesAge, grades, genders, categoriesTypes } from "@/replicache/models/constants";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  tournament: {
    type: Object,
    required: true,
  },
});

const showParticipants = ref(false);
const searchParticipant = ref(null);
const activeTab = ref("category");
const participants = ref([]);
const participantsLoad = ref([]);
const isParticipantsLoaded = ref(false);

// Pour afficher le modal de chargement
const isImporting = ref(false);

const categoryKey = computed(() => `${props.category.id}-${participants.value.length}`);

// choisir le composant en fonction du type de catégorie
const categoryComponent = computed(() => {
  if (!props.category || !props.category.typeId) return null;
  return props.category.typeId === 1 ? PoolList : BracketType;
});

// fonction pour recupérer les participants de la catégorie
const fetchParticipants = async () => {
  if (!props.category.id || !props.tournament.id) return;

  isParticipantsLoaded.value = false;
  try {
    participantsLoad.value = await getParticipantsByCategory(
      props.tournament.id,
      props.category.id
    );
    participants.value = participantsLoad.value;
    isParticipantsLoaded.value = true;
  } catch (error) {
    console.error("Erreur lors de la récupération des participants :", error);
  }
};

watch(activeTab, (newTab) => {
  if (newTab === "statistics") {
    showParticipants.value = false;
  }
});

// écoute les modifs replicache
let unsubscribeParticipants;

onMounted(async () => {
  await fetchParticipants();
  unsubscribeParticipants = rep.subscribe(
    async (tx) => {
      const entries = await tx.scan({ prefix: "participant/" }).entries().toArray();
      return entries;
    },
    () => {
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
  return props.category.typeId === 1 ? ".pool-pdf" : ".bracket";
});

const exportToPDF = async () => {
  isImporting.value = true
  try {
    await nextTick()

    // recupere les elements a exporter
    const elements = document.querySelectorAll(pdfClass.value)
    if (!elements || elements.length === 0) {
      console.error("[exportToPDF] aucun element trouve")
      return
    }

    const categoryTypeObj = categoriesTypes.find(ct => ct.id === props.category.typeId.toString())
    const typeName = categoryTypeObj ? categoryTypeObj.nom : ""

    const genderObj = genders.find(g => g.nom === props.category.genre)
    const genderName = genderObj ? genderObj.nom : props.category.genre

    let ageCategories = ""
    if (props.category.ageCategoryIds && props.category.ageCategoryIds.length > 0) {
      ageCategories = props.category.ageCategoryIds
        .map(id => {
          const cat = categoriesAge.find(a => a.id === id.toString())
          return cat ? cat.nom : id
        })
        .join(", ")
    } else {
      ageCategories = props.category.ageCategories || "n/a"
    }

    const gradeRange = props.category.gradeRange || ""
    const participantCount = props.category.participantCount || ""
    const status = props.category.idWinner ? "termine" : "en cours"
    const winnerName = props.category.winnerName || ""
    const categoryName = props.category.name || ""
    const tournamentName = props.tournament?.name || ""
    const tournamentStartDate = props.tournament?.startDate
      ? new Date(props.tournament.startDate).toLocaleDateString()
      : ""

    // creation du conteneur principal
    const wrapper = document.createElement("div")
    wrapper.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      background: white;
      padding: 20px;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `

    // =============== entete ===============
    const headerContent = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 2rem; color: #333;">${tournamentName} - ${tournamentStartDate}</h1>
      </div>
      <div style="border-top: 1px solid #ddd; padding-top: 10px; border-bottom: 3px solid #0056b3;">
        <h2 style="margin: 0 0 10px 0; font-size: 1.2rem; color: #0056b3;">categorie ${categoryName}</h2>
        <p style="margin: 5px 0; font-size: 1rem; color: #555;">
          <strong>status:</strong> ${status} ${winnerName ? "- gagnant: " + winnerName : ""}
        </p>
        <ul style="list-style: none; padding: 0; margin: 5px 0; font-size: 0.9rem; color: #555;">
          <li><strong>type:</strong> ${typeName}</li>
          <li><strong>genre:</strong> ${genderName}</li>
          <li><strong>age:</strong> ${ageCategories}</li>
          <li><strong>grade:</strong> ${gradeRange}</li>
          <li><strong>participants:</strong> ${participantCount}</li>
          <li><strong>poids:</strong> ${props.category.weightRange || "non defini"}</li>
        </ul>
      </div>
    `
    wrapper.innerHTML = headerContent

    // =============== contenu specifique ===============
    const contentContainer = document.createElement("div")
    contentContainer.style.cssText = `
      position: relative;
      margin-top: 20px;
    `

    // clone tous les elements necessaires
    elements.forEach(el => {
      const clone = el.cloneNode(true)
      clone.style.cssText = `
        box-shadow: none !important;
        background: white !important;
        position: relative !important;
        margin-bottom: 30px;
      `
      contentContainer.appendChild(clone)
    })

    // =============== gestion petite finale ===============
    if (props.category.typeId === 2) { // seulement pour les brackets
      const pfOriginal = document.querySelector(".petite-finale-absolute")
      if (pfOriginal) {
        const pfClone = pfOriginal.cloneNode(true)
        const rect = pfOriginal.getBoundingClientRect()

        pfClone.style.cssText = `
          position: absolute !important;
          top: ${rect.top - 150}px !important;
          left: ${rect.left - 280}px !important;
          background: white !important;
          z-index: 100;
        `
        contentContainer.appendChild(pfClone)
      }
    }

    wrapper.appendChild(contentContainer)

    // =============== correctifs visuels ===============
    const styleElem = document.createElement("style")
    styleElem.textContent = `
      .match-connector, .petite-finale-match::after {
        display: none !important;
      }
      .match-card {
        box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
      }
    `
    wrapper.appendChild(styleElem)

    document.body.appendChild(wrapper)

    // =============== generation pdf ===============
    const canvas = await html2canvas(wrapper, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      logging: true
    })

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    })

    pdf.addImage(canvas, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${props.category.name}_export.pdf`)

    document.body.removeChild(wrapper)

  } catch (error) {
    console.error("erreur lors de l export pdf: ", error)
  } finally {
    isImporting.value = false
  }
}


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

/* styles pour le modal de chargement */
.loading-modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}
</style>
