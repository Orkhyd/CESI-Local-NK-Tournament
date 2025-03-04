<template>
  <div class="category-list-container">

    <VaDataTable :items="formattedCategories" :columns="columns" class="category-table" striped :allowFooterSorting=true
      no-data-html="Aucune catégorie trouvé">

      <!--  genre -->
      <template #cell(genre)="{ row }">
        <div class="genre-container">
          <VaIcon v-if="row.source?.genre === 'Homme'" name="male" class="genre-icon" />
          <VaIcon v-else-if="row.source?.genre === 'Femme'" name="female" class="genre-icon" />
          <VaIcon v-else-if="row.source?.genre === 'Mixte'" name="transgender" class="genre-icon" />
          <span v-else class="genre-text">{{ row.genre }}</span>
        </div>
      </template>

      <!-- tranche d âge -->
      <template #cell(ageCategories)="{ row }">
        <div class="age-container">
          <span v-for="(age, index) in row.source?.ageCategories.split(', ')" :key="index" class="age-tag">
            {{ age }}
          </span>
        </div>
      </template>

      <!--  grade -->
      <template #cell(grade)="{ row }">
        <div class="grade-container">
          <div v-if="row.source?.minGrade === row.source?.maxGrade" class="grade-item">
            <VaIcon name="chevron_right" class="grade-icon" />
            <span class="grade-text">{{ row.source?.minGrade }}</span>
          </div>

          <div v-else>
            <div class="grade-item">
              <VaIcon name="arrow_drop_down" class="grade-icon" />
              <span class="grade-text">{{ row.source?.minGrade }}</span>
            </div>
            <div class="grade-item">
              <VaIcon name="arrow_drop_up" class="grade-icon" />
              <span class="grade-text">{{ row.source?.maxGrade }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- actions-->
      <template #cell(actions)="{ row }">
        <VaButton preset="plain" icon="edit" @click="editCategory(row)" />
        <VaButton preset="plain" icon="delete" class="ml-2" color="danger" @click="confirmDelete(row)" />
      </template>

      <template #cell(participantsCount)="{ row, isExpanded }">
        <VaButton :icon="isExpanded ? 'va-arrow-up' : 'va-arrow-down'" preset="secondary" class="w-full"
          @click="row.toggleRowDetails()">
          {{ row.source?.participantsCount }}
        </VaButton>
      </template>

      <!-- table imbriquée pour afficher les participants -->
      <template #expandableRow="{ rowData }">
        <div class="expandable-container">
          <div class="expandable-content">
            <VaDataTable :items="rowData.participants" :columns="participantColumns" striped class="nested-table" />
          </div>
        </div>
      </template>

    </VaDataTable>

    <!-- modale de confirmation de suppression -->
    <VaModal v-model="showDeleteConfirmation" size="small" hide-default-actions>
      <template #content>
        <div class="confirmation-container">
          <p class="modal-text">
            <template v-if="categoryToDelete?.source?.participants.length > 0">
              Cette catégorie contient {{ categoryToDelete.source?.participants.length }} participant(s).
              <br />
              Êtes-vous sûr de vouloir supprimer cette catégorie ?
              <br />
              <strong>Les participants liés à cette catégorie seront de nouveau disponibles à l'attribution.</strong>
            </template>
            <template v-else>
              Êtes-vous sûr de vouloir supprimer cette catégorie ?
            </template>
          </p>
          <div class="modal-actions">
            <VaButton color="secondary" @click="showDeleteConfirmation = false">
              Annuler
            </VaButton>
            <VaButton color="danger" @click="deleteCategory">
              Supprimer
            </VaButton>
          </div>
        </div>
      </template>
    </VaModal>
  </div>
</template>




<script setup>
import { ref, computed } from "vue";
import { VaDataTable, VaButton, VaModal, VaIcon } from "vuestic-ui";

// def props
const props = defineProps({
  categories: Array,
  participants: Array
});

// def emits
const emit = defineEmits(["edit", "delete"]);

// calc formatted categories
const formattedCategories = computed(() => {
  return props.categories.map((category) => {
    // filtrer participants appartenant a categorie
    const filteredParticipants = props.participants.filter(
      (participant) => participant.categoryId === category.id
    );

    return {
      ...category,
      genre: category.genre || "inconnu",
      type: category.type || "inconnu",
      ageCategories: Array.isArray(category.ageCategories)
        ? category.ageCategories.join(", ")
        : "non defini",
      minGrade: category.minGrade || "inconnu",
      maxGrade: category.maxGrade || "inconnu",
      participants: filteredParticipants, // ajout participants filtres
      participantsCount: `${filteredParticipants.length} participants`, // nb participants affiche
    };
  });
});

// def colonnes participants
const participantColumns = [
  { key: "firstName", label: "prenom", sortable: true },
  { key: "lastName", label: "nom", sortable: true },
  { key: "birthDate", label: "date naissance", sortable: true },
  { key: "gender", label: "genre", sortable: true },
  { key: "grade", label: "grade", sortable: true },
  { key: "clubName", label: "club", sortable: true },
  { key: "weight", label: "poids", sortable: true },
  { key: "nationality", label: "nationalite", sortable: true },
];

// def colonnes categories
const columns = [
  { key: "name", label: "nom", sortable: true },
  { key: "genre", label: "genre", sortable: true },
  { key: "type", label: "type", sortable: true },
  { key: "ageCategories", label: "tranche age", sortable: true },
  { key: "grade", label: "grade", sortable: true },
  { key: "actions", label: "actions", width: "80px" },
  { key: "participantsCount", label: "participants", sortable: false },
];

// gestion conf suppr
const showDeleteConfirmation = ref(false);
const categoryToDelete = ref(null);

// modif categorie
const editCategory = (category) => {
  emit("edit", category);
};

// conf suppr categorie
const confirmDelete = (category) => {
  categoryToDelete.value = category;
  showDeleteConfirmation.value = true;
};

// suppr categorie
const deleteCategory = () => {
  if (categoryToDelete.value) {
    emit("delete", categoryToDelete.value);
  }
  showDeleteConfirmation.value = false;
};
</script>


<style scoped>
/* conteneur tableau */
.category-list-container {
  width: 100%;
  height: 100vh;
  max-height: 200px;;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.expandable-container {
  display: flex;
  flex-direction: column; /* Permet de stacker proprement */
  width: 100%;
}

.expandable-content {
  max-height: 300px; /* Hauteur fixe avec scroll si nécessaire */
  overflow-y: auto; /* Scroll interne si le contenu dépasse */
  width: 100%;
  background: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px;
  transition: max-height 0.3s ease-in-out; /* Animation fluide */
}



/* enleve padding cellules */
:deep(.va-data-table__table .va-data-table__table-td) {
  padding: 1px !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
}

/* assure table ne depasse pas hauteur ecran */
.category-table {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

/* titre centre */
.category-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
}

/* ajuste taille colonnes */
.va-data-table th,
.va-data-table td {
  font-size: 14px;
  padding: 6px;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 150px;
  white-space: normal;
}

/* ajustement colonne tranche age */
.age-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.age-tag {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.grade-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.grade-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.grade-icon {
  font-size: 14px;
  color: gray;
}

.grade-text {
  font-size: 14px;
  font-weight: bold;
}

/* icones genre */
.genre-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.genre-icon {
  font-size: 16px;
}

.genre-text {
  font-size: 14px;
}

/* icones plus petits actions */
.va-button {
  padding: 4px;
  min-width: 30px;
}

/* modale conf */
.confirmation-container {
  padding: 20px;
  text-align: center;
}

.modal-text {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
