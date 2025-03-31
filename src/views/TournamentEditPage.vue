<template>
  <div class="tournament-layout">
    <!-- Titre et bouton d'accueil -->
    <div class="header-container">
      <VaButton @click="goToHomePage" class="home-button" color="primary">
        ⬅ Accueil
      </VaButton>
      <div class="page-title">Paramétrage du Tournoi</div>
    </div>

    <!-- Tabs pour basculer entre Participants et Catégories -->
    <VaTabs v-model="activeTab" grow>
      <template #tabs class="tabs">
        <VaTab name="participants">Participants</VaTab>
        <VaTab name="categories">Catégories</VaTab>
      </template>
    </VaTabs>

    <!-- Contenu des tabs -->
    <div class="content-container">
      <!-- Participants -->
      <div v-if="activeTab === 'participants'" class="participant-section">
        <ParticipantList :participants="formattedParticipants" @edit="handleEditParticipant"
          @create="handleOpenParticipantModal" @delete="handleDeleteParticipant"
          @import-participant="handleImportedParticipants" />
      </div>

      <!-- Catégories -->
      <div v-if="activeTab === 'categories'" class="category-section">
        <VaButton @click="handleOpenCategoryModal" class="create-category-button" color="primary">
          Créer une catégorie
        </VaButton>
        <CategoryList :categories="formattedCategories" :participants="formattedParticipants" @edit="handleEditCategory"
          @create="handleOpenCategoryModal" @delete="handleDeleteCategory" />
      </div>
    </div>

    <!-- Bouton de validation en bas à droite -->
    <div class="validation-button-container">
      <VaButton @click="validateCategories" :disabled="!canValidateCategories" :title="validationMessage"
        color="success" class="validate-categories-button">
        TERMINER LE PARAMETRAGE DU TOURNOI
      </VaButton>
    </div>

    <!-- Modales -->
    <ParticipantModal v-if="selectedParticipant !== null" :modelValue="selectedParticipant !== null"
      :participant="selectedParticipant" @save="handleSaveParticipant"
      @update:modelValue="handleCloseParticipantModal" />

    <CategoryModal v-if="selectedCategory !== null" :modelValue="selectedCategory !== null" :category="selectedCategory"
      :categories="categories" :participants="formattedParticipants" @save="handleSaveCategory"
      @update:modelValue="handleCloseCategoryModal" />

    <!-- Modale d'import des participants -->
    <ImportParticipantsModal v-model="showImportModal" v-if="showImportModal"
      :importedParticipants="importedParticipants" :registeredParticipants="participants" :importColumns="importColumns"
      :getCountry="getCountry" :getFlagUrl="getFlagUrl" :getGradeName="getGradeName" @cancelImport="cancelImport"
      @confirmImport="confirmImport" />

    <!-- Modale de confirmation de tournoi -->
    <VaModal v-model="showValidationModal" hide-default-actions class="validation-modal">
      <div class="modal-card">
        <div class="modal-title">
          <VaIcon name="warning" class="modal-icon" />
          Confirmation de la Validation
        </div>
        <div class="modal-body">
          <p class="modal-text">
            Une fois le tournoi validé, vous ne pourrez plus modifier les catégories ni les participants.
          </p>
          <p class="modal-warning">Cette action est irréversible. Voulez-vous continuer ?</p>
        </div>
        <div class="modal-actions">
          <VaButton color="secondary" outline @click="showValidationModal = false">Annuler</VaButton>
          <VaButton color="success" @click="confirmTournamentValidation">Valider le Tournoi</VaButton>
        </div>
      </div>
    </VaModal>

    <!-- Modale de chargement d'importation de participant -->
    <VaModal v-model="isImporting" hide-default-actions class="loading-modal">
      <VaInnerLoading :loading="true">
        <div class="loading-content">
          <p class="loading-text">Importation des participants en cours...</p>
        </div>
      </VaInnerLoading>
    </VaModal>
  </div>
</template>


<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VaButton } from "vuestic-ui";
import ParticipantModal from "../components/ParticipantModal.vue";
import ParticipantList from "../components/ParticipantList.vue";
import CategoryModal from "../components/CategoryModal.vue";
import CategoryList from "../components/CategoryList.vue";
import ImportParticipantsModal from "../components/ImportParticipantsModal.vue";
import { getParticipantsByTournament } from "../replicache/stores/participantStore";
import { getCategoriesByTournament } from "../replicache/stores/categoryStore";
import { ParticipantService } from "../replicache/services/participantService";
import { CategoryService } from "../replicache/services/categoryService";
import { TournamentService } from "../replicache/services/tournamentService";
import { genders, grades, categoriesAge, categoriesTypes, nationality } from "../replicache/models/constants";
import { useToast } from "vuestic-ui";

// init vuestic toast
const toast = useToast();

// recup route et router
const route = useRoute();
const router = useRouter();
const tournamentId = computed(() => route.params.id);

// def participants
const participants = ref([]);
const selectedParticipant = ref(null);

// def categories
const categories = ref([]);
const selectedCategory = ref(null);

// gestion modale import
const showImportModal = ref(false);
const importedParticipants = ref([]);

// ouvre la modale de confirmation du tournoi
const showValidationModal = ref(false);

// si importation de participant en cours
const isImporting = ref(false);

// redirige vers page accueil
const goToHomePage = () => {
  router.push("/home-page");
};

// reocuperer le nom du pays avec l'id
const getCountry = (natId) => {
  return nationality.find(country => country.id === Number(natId));
};

// recuperer l image en base 64
const getFlagUrl = (flagBase64) => {
  return flagBase64 ? `data:image/png;base64,${flagBase64}` : '';
};

const activeTab = ref("participants"); // affiche les participants par defaut

// gestion participants importes
const handleImportedParticipants = (participants) => {
  if (!participants.length) return;
  importedParticipants.value = participants;
  showImportModal.value = true;
};

// recup nom grade
const getGradeName = (gradeId) => {
  const grade = grades.find(g => Number(g.id) === Number(gradeId));
  return grade ? grade.nom : "Inconnu";
};

// def colonnes import
const importColumns = [
  { key: "firstName", label: "prénom", sortable: true },
  { key: "lastName", label: "nom", sortable: true },
  { key: "birthDate", label: "date naissance", sortable: true },
  { key: "genderId", label: "genre", sortable: false },
  { key: "gradeId", label: "grade", sortable: true },
  { key: "clubName", label: "club", sortable: true },
  { key: "weight", label: "poids", sortable: true },
  { key: "nationalityId", label: "nationalité", sortable: true }
];

// annule import
const cancelImport = () => {
  importedParticipants.value = [];
  showImportModal.value = false;
  toast.init({ message: "Import annulé", color: "danger", position: 'bottom-center' });
};

// confirmer l'importation de participants
const confirmImport = async (selectedItems) => {
  let successCount = 0;
  isImporting.value = true;

  await nextTick();

  const importParticipant = async (index) => {
    if (index >= selectedItems.length) {
      await refreshParticipants();
      isImporting.value = false;
      showImportModal.value = false;
      importedParticipants.value = [];

      if (successCount > 0) {
        toast.init({ message: `${successCount} participant(s) importé(s) avec succès!`, color: "success", position: "bottom-center" });
      }
      return;
    }

    const p = selectedItems[index];
    const formattedParticipant = {
      ...p,
      birthDate: p.birthDate && !isNaN(new Date(p.birthDate)) ? new Date(p.birthDate) : null,
      genderId: {
        text: genders.find((g) => g.id === Number(p.genderId))?.nom || "Inconnu",
        value: Number(p.genderId),
      },
      gradeId: {
        text: grades.find((g) => g.id === Number(p.gradeId))?.nom || "Inconnu",
        value: Number(p.gradeId),
      },
    };

    try {
      await handleSaveParticipant(formattedParticipant, true);
      successCount++;
    } catch (error) {
      toast.init({ message: `${p.firstName} ${p.lastName} impossible à importer`, color: "danger", position: "bottom-center" });
    }

    setTimeout(() => importParticipant(index + 1), 0); // pour pas bloquer le thread principal
  };

  importParticipant(0);
};


// recup participants
const refreshParticipants = async () => {
  if (!tournamentId.value) return;
  try {
    participants.value = await getParticipantsByTournament(tournamentId.value);
  } catch (error) {
    console.error("erreur recup participants:", error);
  }
};

// recup categories
const refreshCategories = async () => {
  if (!tournamentId.value) return;
  try {
    categories.value = await getCategoriesByTournament(tournamentId.value);
  } catch (error) {
    console.error("erreur recup categories:", error);
  }
};

// charge donnees au montage
onMounted(async () => {
  await refreshParticipants();
  await refreshCategories();
});

// formate participants
const formattedParticipants = computed(() =>
  participants.value.map((p) => ({
    ...p,
    gender: genders.find((g) => Number(g.id) === Number(p.genderId))?.nom || "Inconnu",
    grade: grades.find((g) => Number(g.id) === Number(p.gradeId))?.nom || "Inconnu",
  }))
);

// formate categories
const formattedCategories = computed(() =>
  categories.value.map((c) => ({
    ...c,
    genre: genders.find((g) => +g.id === +c.genderId)?.nom || "Inconnu",
    type: categoriesTypes.find((t) => +t.id === +c.typeId)?.nom || "Inconnu",
    minGrade: grades.find((g) => +g.id === +c.minGradeId)?.nom || "Inconnu",
    maxGrade: grades.find((g) => +g.id === +c.maxGradeId)?.nom || "Inconnu",
    ageCategories: c.ageCategoryIds?.length
      ? c.ageCategoryIds.map((id) => categoriesAge.find((a) => +a.id === +id)?.nom || "Inconnu")
      : ["Inconnu"],
  }))
);

// ouvre modale crea participant
const handleOpenParticipantModal = () => {
  selectedParticipant.value = {};
};

// ouvre modale modif participant
const handleEditParticipant = (participant) => {
  selectedParticipant.value = { ...participant };
};

// ferme modale participant
const handleCloseParticipantModal = () => {
  selectedParticipant.value = null;
};

// suppr participant
const handleDeleteParticipant = async (participant) => {
  try {
    await ParticipantService.deleteParticipant(participant.source.id);
    await refreshParticipants();
    toast.init({ message: "Le participant a bien été supprimé!", color: "success", position: 'bottom-center' });
  } catch (error) {
    console.error("erreur suppr participant:", error);
  }
};

// sauvegarde participant
const handleSaveParticipant = async (participantData, silent = false) => {
  if (!tournamentId.value) return;
  try {
    const formattedData = {
      ...participantData,
      birthDate: participantData.birthDate instanceof Date && !isNaN(participantData.birthDate)
        ? participantData.birthDate.toISOString().split("T")[0]
        : null,
      genderId: participantData.genderId?.value || null,
      nationalityId: participantData.nationalityId || null,
      gradeId: participantData.gradeId?.value || null,
    };

    if (participantData.id) {
      await ParticipantService.updateParticipant(participantData.id, formattedData);
    } else {
      await ParticipantService.createParticipant(tournamentId.value, formattedData);
    }

    // PAS DE refreshParticipants ici en cas d'import car sinon trop de refresh == pas optimisé et prend trop de temps !!
    if (!silent) {
      await refreshParticipants();
      toast.init({ message: participantData.id ? "Le participant a bien été mis à jour!" : "Le participant a bien été créé!", color: "success", position: 'bottom-center' });
    }

    if (!silent) {
      handleCloseParticipantModal();
    }
  } catch (error) {
    console.error("erreur enregistrement participant:", error);
  }
};


// ouvre modale crea categorie
const handleOpenCategoryModal = () => {
  selectedCategory.value = {};
};

// ouvre modale modif categorie
const handleEditCategory = (category) => {
  selectedCategory.value = { ...category };
};

// ferme modale categorie
const handleCloseCategoryModal = () => {
  selectedCategory.value = null;
};

// suppr categorie
const handleDeleteCategory = async (category) => {
  try {
    const linkedParticipants = formattedParticipants.value.filter(
      (p) => p.categoryId === category.source?.id
    );
    if (linkedParticipants.length > 0) {
      const participantIds = linkedParticipants.map((p) => p.id);
      await CategoryService.linkParticipants(-1, participantIds);
    }
    await CategoryService.deleteCategory(category.source?.id);
    await refreshCategories();
    await refreshParticipants();
    toast.init({ message: "La catégorie a bien été supprimée!", color: "success", position: 'bottom-center' });
  } catch (error) {
    console.error("erreur suppr categorie:", error);
  }
};

// sauvegarde categorie
const handleSaveCategory = async ({ category, participants }) => {
  let cleanData = JSON.parse(JSON.stringify(category));
  cleanData = {
    ...cleanData,
    genderId: cleanData.genderId?.value ?? cleanData.genderId ?? null,
    typeId: cleanData.typeId?.value ?? cleanData.typeId ?? null,
    minGradeId: cleanData.minGradeId?.value ?? cleanData.minGradeId ?? null,
    maxGradeId: cleanData.maxGradeId?.value ?? cleanData.maxGradeId ?? null,
    ageCategoryIds: cleanData.ageCategoryIds.map(cat => cat?.value ?? cat),
  };
  if (!tournamentId.value) return;
  try {
    let categoryId;
    if (cleanData.id) {
      await CategoryService.updateCategory(cleanData.id, cleanData);
      categoryId = cleanData.id;
      toast.init({ message: "La catégorie a bien été mise à jour!", color: "success", position: 'bottom-center' });
    } else {
      const createdCategory = await CategoryService.createCategory(tournamentId.value, cleanData);
      categoryId = createdCategory.id;
      toast.init({ message: "La catégorie a bien été créée!", color: "success", position: 'bottom-center' });
    }
    if (participants.length > 0) {
      const toLink = participants.filter(p => p.action === "attachToCategory").map(p => p.id);
      const toUnlink = participants.filter(p => p.action === "unlinkFromCategory").map(p => p.id);
      if (toLink.length > 0) {
        await CategoryService.linkParticipants(categoryId, toLink);
      }
      if (toUnlink.length > 0) {
        await CategoryService.linkParticipants(-1, toUnlink);
      }
    }
    await refreshCategories();
    await refreshParticipants();
    handleCloseCategoryModal();
  } catch (error) {
    console.error("erreur enregistrement categorie:", error);
  }
};

// valider ou non une categorie pour la suite
const validateCategory = (category) => {
  if (!category.typeId) {
    return { isValid: false, message: `La catégorie "${category.name}" n'a pas de type défini.` };
  }

  const categoryType = categoriesTypes.find((t) => Number(t.id) === Number(category.typeId));

  if (!categoryType) {
    return { isValid: false, message: `Le type de la catégorie "${category.name}" est invalide.` };
  }

  const participantsInCategory = formattedParticipants.value.filter(
    (p) => p.categoryId === category.id
  ).length;

  if (participantsInCategory < categoryType.minParticipants) {
    return {
      isValid: false,
      message: `La catégorie "${category.name}" nécessite au moins ${categoryType.minParticipants} participants avec ce type de catégorie (actuellement : ${participantsInCategory}).`
    };
  }

  if (participantsInCategory > categoryType.maxParticipants) {
    return {
      isValid: false,
      message: `La catégorie "${category.name}" ne peut contenir plus de ${categoryType.maxParticipants} participants avec ce type de catégorie (actuellement : ${participantsInCategory}).`
    };
  }


  return { isValid: true, message: "" };
};

// verif globale des categories
const canValidateCategories = computed(() =>
  categories.value.length > 0 && categories.value.every((category) => validateCategory(category).isValid)
);

// creer le message d erreur du survol sur le boputon validation
const validationMessage = computed(() => {
  if (categories.value.length === 0) {
    return "Aucune catégorie n'a été créée.";
  }

  for (const category of categories.value) {
    const result = validateCategory(category);
    if (!result.isValid) {
      return result.message;
    }
  }

  return "Toutes les catégories sont valides et prêtes à être validées.";
});



// fonction appelée lors du clic sur "Valider les catégories"
const validateCategories = () => {
  showValidationModal.value = true; // modale de confirmation
};

// logique de confoirmation du tournoi definitive
const confirmTournamentValidation = async () => {
  if (!tournamentId.value) return;

  try {
    await TournamentService.startTournament(tournamentId.value); // majl'état du tournoi en "démarré"

    showValidationModal.value = false; // ferme la modale

    toast.init({
      message: "Le tournoi est maintenant validé et ne peut plus être modifié !",
      color: "success", position: 'bottom-center'
    });

    router.push(`/tournament/started/${tournamentId.value}`);

  } catch (error) {
    console.error("Erreur lors de la validation du tournoi :", error);
    toast.init({
      message: "Une erreur est survenue lors de la validation du tournoi.",
      color: "danger", position: 'bottom-center'
    });
  }
};

</script>


<style scoped>
/* header contenant le bouton et le titre */
.tournament-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  /* Pour positionner le bouton de validation */
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 15px;
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 40px;
  font-weight: bold;
  color: #0c2432;
  font-family: Courier, monospace;
  margin-right: 20px;
}

.home-button {
  padding: 1px 2px;
  font-size: 14px;
  width: 100px;
  margin: 5px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.loading-modal .va-modal__container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.participant-section,
.category-section {
  flex: 1;
  padding: 15px;
  border-radius: 10px;
  overflow: hidden;
}

.va-tabs .va-tabs__container--grow .va-tab {
  font-size: 20px !important;
  font-weight: bold;
}

.validation-modal {
  display: flex !important;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  width: 100%;
  text-align: center;
}

.modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.modal-icon {
  color: #ffcc00;
  margin-right: 10px;
  font-size: 1.8rem;
}

.modal-body {
  margin-bottom: 25px;
}

.modal-text {
  font-size: 1rem;
  margin-bottom: 15px;
  line-height: 1.5;
}

.modal-warning {
  font-size: 1rem;
  color: #d32f2f;
  margin-bottom: 15px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.create-category-button {
  display: block;
  margin-left: auto;
  padding: 6px 12px;
  margin-bottom: 10px;
}

.validation-button-container {
  margin: 5px;
  margin-bottom: 15px;
}

.validate-categories-button {
  padding: 1px 2px;
  font-size: 14px;
  display: flex;
  width: 98%;
  margin: auto;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

/* Styles pour les tabs */
.va-tabs {
  margin-bottom: 20px;
  /* Espace entre les tabs et le contenu */
}

.va-tab {
  font-size: 16px;
  font-weight: bold;
}

.va-tab--active {
  color: #0c2432;
  /* Couleur de l'onglet actif */
}

/* Responsive */
@media screen and (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }

  .participant-section,
  .category-section {
    width: 100%;
    height: auto;
  }
}
</style>
