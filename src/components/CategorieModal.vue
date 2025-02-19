<template>
  <VaModal v-model="isOpen" hide-default-actions class="modal">
    <div class="modal-card">
      <!-- titre de modale -->
      <h2 class="modal-title">
        <VaIcon name="category" class="modal-icon" />
        {{ isEditMode ? "Modifier la catégorie" : "Ajouter une catégorie" }}
      </h2>

      <VaCardContent>
        <!--  création/modification de catégorie -->
        <div class="form-grid">
          <VaInput v-model="nom" clearable label="nom de la categorie *" class="input-field"
            placeholder="ex : -70kg juniors" />
          <VaSelect v-model="type" clearable label="type" :options="typesCategories" class="input-field"
            placeholder="selectionnez un type" />
          <VaSelect v-model="genre" clearable label="genre *" :options="genres" class="input-field"
            placeholder="selectionnez un genre" />
          <VaSelect v-model="selectedAges" label="categorie d age *" clearable :options="categoriesAge"
            class="input-field wide" placeholder="selectionnez une ou plusieurs categories d age" multiple searchable />
          <VaSelect v-model="gradeMin" clearable label="grade minimum *" :options="grades" class="input-field"
            placeholder="selectionnez un grade" @update:modelValue="updateGradeMaxFilter" />
          <VaSelect v-model="gradeMax" label="grade maximum *" clearable :options="filteredGrades" class="input-field"
            placeholder="selectionnez un grade superieur ou egal" :disabled="!gradeMin" />
        </div>

        <!-- BBaarre de recherche globale -->
        <VaInput v-model="globalSearch" clearable label="rechercher un participant"
          placeholder="rechercher par nom, club, grade, etc..." class="search-bar">
        </VaInput>/>

                <!-- secction pour afficher le nombre de participants sélectionnés -->
                <div class="selected-participants">
          Participants sélectionnés : {{ selectedParticipants.length }}
        </div>


        <!-- Tableau des participant -->
        <VaDataTable :items="filteredParticipants" :columns="columns" class="participants-table" striped hoverable
          dense>
          <!-- Colonne de selectionn -->
          <template #cell(select)="{ rowData }">
            <VaCheckbox :model-value="selectedParticipants.includes(rowData.id)"
              @update:model-value="toggleParticipant(rowData.id)" :disabled="rowData.disabled" />
          </template>

          <!--  Statutt -->
          <template #cell(status)="{ rowData }">
            <VaChip :color="rowData.disabled ? 'danger' : 'success'" size="small">
            </VaChip>
          </template>

          <!--Nom & Prénom -->
          <template #cell(nom)="{ rowData }">
            <div class="participant-name">
              <VaIcon name="person" class="cell-icon" />
              {{ rowData.nom }} {{ rowData.prenom }}
            </div>
          </template>

          <!-- Club -->
          <template #cell(club)="{ rowData }">
            <div class="participant-club">
              <VaIcon name="location_city" class="cell-icon" />
              {{ rowData.club || "non renseigne" }}
            </div>
          </template>

          <!-- sexe : genre -->
          <template #cell(sexe)="{ rowData }">
            <VaChip color="info" size="small">
              <VaIcon name="transgender" class="chip-icon" />
              {{ rowData.sexe?.text || "non specifie" }}
            </VaChip>
          </template>

          <!-- Poids -->
          <template #cell(poids)="{ rowData }">
            <div class="participant-poids">
              <VaIcon name="fitness_center" class="cell-icon" />
              {{ rowData.poids ? `${rowData.poids} kg` : "non renseigne" }}
            </div>
          </template>

          <!--  date de naissance -->
          <template #cell(dateNaissance)="{ rowData }">
            <div class="participant-date">
              <VaIcon name="calendar_today" class="cell-icon" />
              {{ formatDate(rowData.dateNaissance) }}
            </div>
          </template>

          <!-- GRade -->
          <template #cell(grade)="{ rowData }">
            <VaIcon name="sports_martial_arts" class="chip-icon" />
            {{ rowData.grade?.text || "aucun" }}
          </template>
        </VaDataTable>
      </VaCardContent>

      <!-- acctions de la modale -->
      <VaCardActions align="right" class="modal-actions">
        <VaButton color="secondary" outline @click="close">annuler</VaButton>
        <VaButton color="primary" :disabled="!isFormValid" @click="saveCategory">
          {{ isEditMode ? "Modifier" : "Ajouter" }}
        </VaButton>
      </VaCardActions>
      
    </div>
    
  </VaModal>
</template>

<script setup>
import { ref, computed, defineEmits, watch } from "vue";
import {
  getAllGrades,
  getAllGenres,
  getAllTypesCategories,
  getAllCategoriesAge,
  getAllParticipants,
  getParticipantsByCategorie,
  getLastTournoi,
  getAllAssignedParticipants
} from "@/store/tournoiStore";

// etat de la modale et du mode d'edition
const isOpen = ref(false);
const isEditMode = ref(false);
const editingCategoryId = ref(null);

// donnees du formulaire
const nom = ref("");
const type = ref(null);
const genre = ref(null);
const selectedAges = ref([]);
const gradeMin = ref(null);
const gradeMax = ref(null);
const selectedParticipants = ref([]);

// options des selects
const typesCategories = ref([]);
const genres = ref([]);
const categoriesAge = ref([]);
const grades = ref([]);
const participantsOptions = ref([]);

const globalSearch = ref("");

// colonnes du tableau des participants
const columns = [
  { key: "select", label: "✔", sortable: false },
  { key: "status", label: "Statut", sortable: false },
  { key: "nom", label: "Nom & Prénom", sortable: true },
  { key: "club", label: "Club", sortable: true },
  { key: "sexe", label: "Sexe", sortable: true },
  { key: "poids", label: "Poids", sortable: true },
  { key: "dateNaissance", label: "Date de naissance", sortable: true },
  { key: "grade", label: "Grade", sortable: true },
];

// filtrge des participants
const filteredParticipants = computed(() => {
  return participantsOptions.value.filter((participant) => {
    const searchTerm = globalSearch.value.toLowerCase();
    return (
      participant.nom?.toLowerCase().includes(searchTerm) ||
      participant.prenom?.toLowerCase().includes(searchTerm) ||
      participant.club?.toLowerCase().includes(searchTerm) ||
      (participant.grade?.text && participant.grade.text.toLowerCase().includes(searchTerm)) ||
      (participant.sexe?.text && participant.sexe.text.toLowerCase().includes(searchTerm)) ||
      (participant.poids && participant.poids.toString().includes(searchTerm)) ||
      (participant.dateNaissance && formatDate(participant.dateNaissance).toLowerCase().includes(searchTerm))
    );
  });
});

// fformatage de la date
const formatDate = (dateString) => {
  if (!dateString) return "Non renseigné";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};


// emission d'evenements au aprent pour sauvegarder le participant
const emit = defineEmits(["save"]);

// chargement des donnees a l'ouverture de la modale
watch(isOpen, async (newVal) => {
  if (newVal) {
    await loadData();
  }
});

// gestion de la selection/deselection des participants
const toggleParticipant = (participantId) => {
  if (selectedParticipants.value.includes(participantId)) {
    selectedParticipants.value = selectedParticipants.value.filter(id => id !== participantId);
  } else {
    selectedParticipants.value = [...selectedParticipants.value, participantId];
  }
};

// chargement des donnees necessaires pour le formulaire
const loadData = async () => {
  try {
    const [typesRaw, genresRaw, categoriesAgeRaw, gradesRaw] = await Promise.all([
      getAllTypesCategories(),
      getAllGenres(),
      getAllCategoriesAge(),
      getAllGrades(),
    ]);

    // mise en forme des donnees pour les selects
    typesCategories.value = typesRaw.map(t => ({ text: t.label || t.nom, value: t.value || t.id }));
    genres.value = genresRaw.map(g => ({ text: g.label || g.nom, value: g.value || g.id }));
    categoriesAge.value = categoriesAgeRaw.map(c => ({ text: c.label || c.nom, value: c.value || c.id }));
    grades.value = gradesRaw.map(g => ({ text: g.label || g.nom, value: g.value || g.id }));

    // recuperation du dernier tournoi
    const tournoi = await getLastTournoi();
    if (!tournoi) return;

    // recuperation de tous les participants
    const participants = await getAllParticipants();

    // reccup de tous les participants deja assignes a une categorie
    const allAssignedParticipants = await getAllAssignedParticipants();

    // mise en forme des participants pour le tableau
    participantsOptions.value = participants.map(p => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      club: p.club || "Non renseigné",
      grade: p.grade || { text: "Aucun" },
      sexe: p.sexe || { text: "Non spécifié" },
      poids: p.poids || null,
      dateNaissance: p.dateNaissance || null,
      disabled: allAssignedParticipants.includes(p.id) && !selectedParticipants.value.includes(p.id),
    }));

  } catch (error) {
    console.error("erreur de chargement :", error);
  }
};

// validation du formulaire
const isFormValid = computed(() => nom.value && genre.value && selectedAges.value.length > 0 && gradeMin.value && gradeMax.value);

// filtrage des grades en fonction du grade minimum selectionne
const filteredGrades = computed(() => {
  if (!gradeMin.value) return grades.value;
  return grades.value.filter(g => g.value >= gradeMin.value.value);
});

// mise a jour du filtre du grade maximum
const updateGradeMaxFilter = () => {
  if (!gradeMin.value) {
    gradeMax.value = null; // reinitialise gradeMax si gradeMin est supprime
    return;
  }

  if (gradeMax.value && gradeMax.value.value < gradeMin.value.value) {
    gradeMax.value = null;
  }
};

// sauvegarde de la categorie
const saveCategory = () => {

  const newCategory = {
    id: editingCategoryId.value || Date.now(),
    nom: nom.value,
    type: type.value,
    genre: genre.value,
    selectedAges: selectedAges.value,
    gradeMin: gradeMin.value ? { text: gradeMin.value.text, value: gradeMin.value.value } : null,
    gradeMax: gradeMax.value ? { text: gradeMax.value.text, value: gradeMax.value.value } : null,
    selectedParticipants: Array.isArray(selectedParticipants.value) ? selectedParticipants.value : [],
  };


  emit("save", newCategory);
  close();
};

// fermeture de la modale et reinitialisation des champs
const close = () => {
  isOpen.value = false;
  resetFields();
};

// reinitt des champs du formulaire
const resetFields = () => {
  nom.value = "";
  type.value = null;
  genre.value = null;
  selectedAges.value = [];
  gradeMin.value = null;
  gradeMax.value = null;
  selectedParticipants.value = [];
};

// ouvrir la modale en mode creation ou edition
defineExpose({
  open: () => {
    resetFields();  // assure que toutes les valeurs sont reinitialisees avant d'ouvrir la modale
    isEditMode.value = false;
    isOpen.value = true;
  },

  openEdit: async (category) => {
    isEditMode.value = true;
    editingCategoryId.value = category.id;
    isOpen.value = true;

    // charger les valeurs de la categorie existante
    nom.value = category.nom;
    type.value = category.type;
    genre.value = category.genre;
    selectedAges.value = category.selectedAges || [];
    gradeMin.value = category.gradeMin ? { text: category.gradeMin.text, value: category.gradeMin.value } : null;
    gradeMax.value = category.gradeMax ? { text: category.gradeMax.text, value: category.gradeMax.value } : null;

    // charger les participants assignes a cette categorie
    const assignedParticipants = await getParticipantsByCategorie(category.id);
    selectedParticipants.value = assignedParticipants.map(p => p.id);

    // recharger la liste des participants et mettre a jour ceux deja assignes ailleurs
    await loadData();
  }
});
</script>

<style scoped>
/* corrige la largeur max de VaModal */
:deep(.va-modal__dialog) {
  max-width: 90vw !important;
  width: 90vw !important;
  height: 90vh !important;
  max-height: 90vh !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* fond de la modale */
.modal {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
}

/* carte de la modale */
.modal-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  width: 86vw;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* contenu principal - évite les barres de scroll */
.VaCardContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* grille des champs */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

/* barre de recherche */
.search-bar {
  margin-top: 20px;
  width: 60%;
  border-bottom: 1px solid #007bff;
  border-radius: 20px;
  padding: 8px 12px;
  background: #f8f9fa;
  font-size: 14px;
}

/* section des participants selectionnes */
.selected-participants {
  margin-top: 10px;
  font-size: 15px;
  margin-bottom: 10px;
}

.participant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.participant-item {
  background-color: #f0f0f0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

/* tableau des participants */
.participants-table {
  width: 100%;
  border-radius: 8px;
  overflow: auto;
  flex: 1;
}

/* icônes dans les cellules */
.cell-icon {
  margin-right: 6px;
  color: var(--va-secondary);
}

/* chips pour les statuts */
.chip-icon {
  margin-right: 4px;
}

/* actions de la modale */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>