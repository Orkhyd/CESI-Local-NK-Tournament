<template>
  <div class="tournament-layout">
    <!-- titre -->
    <div class="header-container">
      <VaButton @click="goToHomePage" class="home-button" color="primary">
        ⬅ Accueil
      </VaButton>
      <h1 class="page-title">Gestion du Tournoi</h1>
      <VaButton @click="validateCategories" :disabled="!canValidateCategories" :title="validationMessage"
        color="success" class="validate-categories-button">
        Valider les catégories
      </VaButton>
    </div>

    <!-- Conteneur des catégories et des participants -->
    <div class="content-container">
      <!-- Catégories à gauche -->
      <div class="category-section">
        <h2 class="section-title">Catégories</h2>
        <VaButton @click="handleOpenCategoryModal" class="action-button create-category-button" color="primary">
          Créer une catégorie
        </VaButton>
        <CategoryList :categories="formattedCategories" :participants="formattedParticipants" @edit="handleEditCategory"
          @create="handleOpenCategoryModal" @delete="handleDeleteCategory" />
      </div>

      <!-- Participants à droite -->
      <div class="participant-section">
        <h2 class="section-title">Participants</h2>
        <ParticipantList :participants="formattedParticipants" @edit="handleEditParticipant"
          @create="handleOpenParticipantModal" @delete="handleDeleteParticipant"
          @import-participant="handleImportedParticipants" />
      </div>
    </div>

    <!-- Modales -->
    <ParticipantModal v-if="selectedParticipant !== null" :modelValue="selectedParticipant !== null"
      :participant="selectedParticipant" @save="handleSaveParticipant"
      @update:modelValue="handleCloseParticipantModal" />

    <CategoryModal v-if="selectedCategory !== null" :modelValue="selectedCategory !== null" :category="selectedCategory"
      :participants="formattedParticipants" @save="handleSaveCategory" @update:modelValue="handleCloseCategoryModal" />

    <!-- modale d'import des participants -->
    <VaModal v-model="showImportModal" size="large" hide-default-actions>
      <template #content>
        <div class="import-modal">
          <h2 class="modal-title">Participants importés</h2>

          <VaDataTable :items="importedParticipants" :columns="importColumns" striped no-data-html="Aucun participant">
            <!-- Genre avec icône -->
            <template #cell(genderId)="{ row }">
              <VaIcon :name="row.genderId === 1 ? 'male' : 'female'" class="gender-icon" />
            </template>

            <!-- Grade affiché en texte -->
            <template #cell(gradeId)="{ row }">
              {{ getGradeName(row.source?.gradeId) }}
            </template>
          </VaDataTable>


          <div class="modal-actions">
            <VaButton color="secondary" @click="cancelImport"> Annuler </VaButton>
            <VaButton color="primary" @click="confirmImport"> Confirmer l'import </VaButton>
          </div>
        </div>
      </template>
    </VaModal>


  </div>
</template>



<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VaButton } from "vuestic-ui";
import ParticipantModal from "../components/ParticipantModal.vue";
import ParticipantList from "../components/ParticipantList.vue";
import CategoryModal from "../components/CategoryModal.vue";
import CategoryList from "../components/CategoryList.vue";
import { getParticipantsByTournament } from "../replicache/stores/participantStore";
import { getCategoriesByTournament } from "../replicache/stores/categoryStore";
import { ParticipantService } from "../replicache/services/participantService";
import { CategoryService } from "../replicache/services/categoryService";
import { genders, grades, categoriesAge, categoriesTypes } from "../replicache/models/constants";
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

// redirige vers page accueil
const goToHomePage = () => {
  router.push("/home-page");
};

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
  { key: "firstName", label: "prenom", sortable: true },
  { key: "lastName", label: "nom", sortable: true },
  { key: "birthDate", label: "date naissance", sortable: true },
  { key: "genderId", label: "genre", sortable: false },
  { key: "gradeId", label: "grade", sortable: true },
  { key: "clubName", label: "club", sortable: true },
  { key: "weight", label: "poids", sortable: true },
  { key: "nationality", label: "nationalite", sortable: true }
];

// annule import
const cancelImport = () => {
  importedParticipants.value = [];
  showImportModal.value = false;
  toast.init({ message: "Import annulé", color: "danger" });
};

// confirme import
const confirmImport = () => {
  importedParticipants.value.forEach(p => {
    const formattedParticipant = {
      ...p,
      birthDate: new Date(p.birthDate),
      genderId: {
        text: genders.find(g => g.id === Number(p.genderId))?.nom || "Inconnu",
        value: Number(p.genderId),
      },
      gradeId: {
        text: grades.find(g => g.id === Number(p.gradeId))?.nom || "Inconnu",
        value: Number(p.gradeId),
      },
    };
    handleSaveParticipant(formattedParticipant);
  });
  showImportModal.value = false;
  importedParticipants.value = [];
  toast.init({ message: "Import valide et ajouté", color: "success" });
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
    genre: genders.find((g) => +g.id === +c.genreId)?.nom || "Inconnu",
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
    await ParticipantService.delete(participant.source.id);
    await refreshParticipants();
  } catch (error) {
    console.error("erreur suppr participant:", error);
  }
};

// sauvegarde participant
const handleSaveParticipant = async (participantData) => {
  if (!tournamentId.value) return;
  try {
    const formattedData = {
      ...participantData,
      birthDate: participantData.birthDate ? participantData.birthDate.toISOString().split("T")[0] : null,
      genderId: participantData.genderId?.value || null,
      gradeId: participantData.gradeId?.value || null,
    };
    if (participantData.id) {
      await ParticipantService.update(participantData.id, formattedData);
    } else {
      await ParticipantService.create(tournamentId.value, formattedData);
    }
    await refreshParticipants();
    handleCloseParticipantModal();
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
    await CategoryService.delete(category.source?.id);
    await refreshCategories();
    await refreshParticipants();
  } catch (error) {
    console.error("erreur suppr categorie:", error);
  }
};

// sauvegarde categorie
const handleSaveCategory = async ({ category, participants }) => {
  let cleanData = JSON.parse(JSON.stringify(category));
  cleanData = {
    ...cleanData,
    genreId: cleanData.genreId?.value ?? cleanData.genreId ?? null,
    typeId: cleanData.typeId?.value ?? cleanData.typeId ?? null,
    minGradeId: cleanData.minGradeId?.value ?? cleanData.minGradeId ?? null,
    maxGradeId: cleanData.maxGradeId?.value ?? cleanData.maxGradeId ?? null,
    ageCategoryIds: cleanData.ageCategoryIds.map(cat => cat?.value ?? cat),
  };
  if (!tournamentId.value) return;
  try {
    let categoryId;
    if (cleanData.id) {
      await CategoryService.update(cleanData.id, cleanData);
      categoryId = cleanData.id;
    } else {
      const createdCategory = await CategoryService.create(tournamentId.value, cleanData);
      categoryId = createdCategory.id;
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
      message: `La catégorie "${category.name}" nécessite au moins ${categoryType.minParticipants} participants (actuellement : ${participantsInCategory}).`
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
  toast.init({ message: "Les catégories ont été validées avec succès !", color: "success" });
  // logique pour valider le tournoi ces categories etc... et aller vers l'affichage des categories du tournoi
};

</script>


<style scoped>
/* header contenant le bouton et le titre */
.header-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 10px;
}

/* style du bouton d'accueil */
.home-button {
  padding: 1px 2px;
  font-size: 14px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

/* style du titre centré */
.page-title {
  flex: 1;
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: #154EC1;
  margin-right: 120px;
}

.import-modal {
  padding: 20px;
  text-align: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 15px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.gender-icon {
  font-size: 18px;
  color: #007bff;
}

/* layout global qui occupe toute la page */
.tournament-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.category-section {
  position: relative;
}

.create-category-button {
  position: absolute;
  right: 15px;
  top: 10px;
  height: 45px !important;
}


/* titre centré */
.page-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: #154EC1;
  margin-bottom: 20px;
}

/* boutons bien centrés */
.buttons-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

/* boutons stylisés */
.action-button {
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
}

/* conteneur des catégories et participants - Prend toute la place disponible */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* sections égales, prennent 50% de la largeur */
.category-section,
.participant-section {
  display: flex;
  flex-direction: column;
  padding: 15px;
  border-radius: 10px;
  background: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow: hidden;
}

.category-section {
  flex: 4;
}

.participant-section {
  flex: 7;
}

/* ✅ Titre des sections */
.section-title {
  padding-bottom: 5px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #262824;
  margin-bottom: 10px;
  text-align: center;
}

/* ✅ Assurer que le contenu des listes s'adapte bien */
.category-section,
.participant-section {
  display: flex;
  flex-direction: column;
}

.category-section>*:not(.section-title),
.participant-section>*:not(.section-title) {
  flex: 1;
  /* Permet de scroller à l'intérieur si nécessaire */
}

/* ✅ Responsive : en colonne sur petit écran */
@media screen and (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }

  .category-section,
  .participant-section {
    width: 100%;
    height: auto;
  }
}
</style>
