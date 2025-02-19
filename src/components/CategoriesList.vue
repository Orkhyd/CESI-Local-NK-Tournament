<template>
  <div class="table-wrapper">

    <VaDataTable
      :items="categories"
      :columns="columns"
      class="categories-table"
      striped
      hoverable
      no-data-html="Aucune catégorie disponible"
    >
      <!-- genre -->
      <template #cell(genre)="{ rowData }">
        <VaChip color="primary" size="small">
          <VaIcon name="transgender" class="chip-icon" />
          {{ rowData.genre?.text || "Non spécifié" }}
        </VaChip>
      </template>

      <!-- ages -->
      <template #cell(selectedAges)="{ rowData }">
        <span class="small-text">{{ rowData.selectedAges?.map(a => a.text).join(", ") || "Aucun" }}</span>
      </template>

      <!-- grrades (Min en haut, Max en bas) -->
      <template #cell(grades)="{ rowData }">
        <div class="grades-container">
          <div v-if="rowData.gradeMin" class="grade">
            <VaIcon name="arrow_drop_down" class="grade-icon" />
            Min: {{ rowData.gradeMin?.text }}
          </div>
          <div v-if="rowData.gradeMax" class="grade">
            <VaIcon name="arrow_drop_up" class="grade-icon" />
            Max: {{ rowData.gradeMax?.text }}
          </div>
        </div>
      </template>

      <!-- Type de catégorie -->
      <template #cell(type)="{ rowData }">
        <VaChip color="secondary" size="small">
          <VaIcon name="table" class="chip-icon" />
          {{ rowData.type?.text || "N/A" }}
        </VaChip>
      </template>

      <!-- actions -->
      <template #cell(actions)="{ rowData }">
        <div class="actions">
          <VaButton icon="edit" color="warning" size="small" @click="editCategory(rowData)" />
          <VaButton icon="delete" color="danger" size="small" @click="deleteCategory(rowData.id)" />
        </div>
      </template>
    </VaDataTable>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";

const props = defineProps({
  categories: Array
});

const emit = defineEmits(["edit", "delete"]);

const columns = computed(() => [ // colonnes de la grille
  { key: "nom", label: "Nom", sortable: true },
  { key: "genre", label: "Genre", sortable: false },
  { key: "type", label: "Type", sortable: true },
  { key: "selectedAges", label: "Âges", sortable: false },
  { key: "grades", label: "Grades", sortable: false },
  { key: "actions", label: "Actions", sortable: false }
]);

const editCategory = (category) => emit("edit", category);
const deleteCategory = (categoryId) => emit("delete", categoryId);

</script>

<style scoped>
/* conteneur global */
.table-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Header du tableau */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.table-title {
  font-size: 20px;
  font-weight: bold;
}

/* Table style */
.categories-table {
  width: 100%;
  border-radius: 8px;
  background: var(--va-background-primary);
  box-shadow: var(--va-box-shadow);
}

/* texte dans les cellules, bien aligné */
.table-text {
  font-size: 14px;
  text-align: left;
  display: block;
}

/* icoones des chips */
.chip-icon {
  margin-right: 4px;
}

/* alignement des actions */
.actions {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
}

/* grades bien affichés sur deux lignes */
.grades-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 3px;
}

/* ligne de grade */
.grade {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

/* icoones pour les grades */
.grade-icon {
  color: var(--va-primary);
}
</style>

