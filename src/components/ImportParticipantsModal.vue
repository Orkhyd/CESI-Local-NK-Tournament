<template>
  <VaModal v-model="modelValue" size="large" hide-default-actions>
    <template #content>
      <div class="import-modal">
        <h2 class="modal-title">{{ importedParticipants.length }} participants dans le fichier</h2>
        <p class="import-summary">
          {{ defaultSelectedItems.length }} disponibles, {{ importedParticipants.length - defaultSelectedItems.length }}
          duplicata(s) : participant déjà existant, basé sur le prénom, nom et date de naissance.
        </p>

        <!-- recherche -->
        <div class="search-container">
          <VaInput v-model="searchQuery" placeholder="Rechercher un participant..." clearable class="search-input" />
        </div>

        <!-- booutons personnalisés pour Tout sélectionner et Tout deselectionner -->
        <div class="select-all-container" v-if="defaultSelectedItems.length > 0">
          <VaButton color="primary" @click="selectAll">Tout sélectionner</VaButton>
          <VaButton color="primary" @click="deselectAll">Tout désélectionner</VaButton>
        </div>

        <div class="datatable-container">
          <VaDataTable v-model="selectedImportItems" :items="filteredParticipants" :columns="importColumns" selectable
            select-mode="multiple" :row-bind="rowBind" striped no-data-html="Aucun participant" virtual-scroller
            :stickyHeader="true" @row:click="toggleImportSelection">
            <!-- cellule genre -->
            <template #cell(genderId)="{ row }">
              <VaIcon :name="row.source.genderId === 1 ? 'male' : 'female'" class="gender-icon" />
            </template>

            <!-- ccellule nationalité -->
            <template #cell(nationalityId)="{ row }">
              <div class="nationality-cell">
                <img v-if="getCountry(row.source?.nationalityId)"
                  :src="getFlagUrl(getCountry(row.source?.nationalityId).flag)" alt="flag" class="nationality-flag" />
                <span>
                  {{ getCountry(row.source?.nationalityId)?.name || row.source?.nationalityId }}
                </span>
              </div>
            </template>

            <!-- cellule grade -->
            <template #cell(gradeId)="{ row }">
              {{ getGradeName(row.source?.gradeId) }}
            </template>

          </VaDataTable>
        </div>

        <!-- message si aucun participant disponible pour l'import -->
        <div v-if="defaultSelectedItems.length === 0" class="no-participants-alert">
          <VaAlert color="warning">Aucun participant disponible pour l'import.</VaAlert>
        </div>

        <!-- btn d'action toujours visibles -->
        <div class="modal-actions">
          <VaButton color="secondary" @click="cancelImport">Annuler</VaButton>
          <VaButton color="primary" @click="confirmImport" :disabled="selectedImportItems.length === 0">
            Confirmer l'import ({{ selectedImportItems.length }} sélectionnés)
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { VaModal, VaDataTable, VaIcon, VaButton, VaAlert, VaInput } from 'vuestic-ui';

// props attendues
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  importedParticipants: { type: Array, default: () => [] },
  importColumns: { type: Array, default: () => [] },
  getCountry: { type: Function, required: true },
  getFlagUrl: { type: Function, required: true },
  getGradeName: { type: Function, required: true },
  registeredParticipants: { type: Array, default: () => [] }     // liste des participants déjà enregistrés
});

const emit = defineEmits(["update:modelValue", "cancelImport", "confirmImport"]);

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

// ref pour gérer la sélection dans la datatable
const selectedImportItems = ref([]);

// ref pour la recherche
const searchQuery = ref("");

// fnction de comparaison basée sur prénom, nom et date de naissance
function isDuplicate(item) {
  return props.registeredParticipants.some(reg => {
    const regBirth = new Date(reg.birthDate).toISOString().split('T')[0];
    const itemBirth = new Date(item.birthDate).toISOString().split('T')[0];
    return (
      reg.firstName.trim().toLowerCase() === item.firstName.trim().toLowerCase() &&
      reg.lastName.trim().toLowerCase() === item.lastName.trim().toLowerCase() &&
      regBirth === itemBirth
    );
  });
}

// filtrer les participants non duplicata
const defaultSelectedItems = computed(() =>
  props.importedParticipants.filter(item => !isDuplicate(item))
);

// filtrer les participants en fonction de la recherche
const filteredParticipants = computed(() => {
  return sortedImportedParticipants.value.filter((participant) => {
    const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.value.toLowerCase());
  });
});

const toggleImportSelection = ({ item }) => {
  if (isDuplicate(item)) return; // empeccher la sélection des duplicatas

  // cle unique basée sur prénom + nom + date de naissance CAR pas d id en import !!!
  const itemKey = `${item.firstName}-${item.lastName}-${item.birthDate}`;

  // verif si l'élément est déjà sélectionné
  const index = selectedImportItems.value.findIndex(p => 
    `${p.firstName}-${p.lastName}-${p.birthDate}` === itemKey
  );

  if (index === -1) {
    selectedImportItems.value.push(item); 
  } else {
    selectedImportItems.value.splice(index, 1); 
  }
};




// bouton "Tout sélectionner" : sélectionne uniquement les items disponibles
const selectAll = () => {
  selectedImportItems.value = defaultSelectedItems.value;
};

// bouton "Tout désélectionner" : vide la sélection
const deselectAll = () => {
  selectedImportItems.value = [];
};

// trier la liste : d'abord les participants non duplicata, puis les duplicata
const sortedImportedParticipants = computed(() => {
  const available = props.importedParticipants.filter(item => !isDuplicate(item));
  const duplicates = props.importedParticipants.filter(item => isDuplicate(item));
  return [...available, ...duplicates];
});

// retirer automatiquement les items désactivés s'ils sont ajoutés
watch(selectedImportItems, (newSelection) => {
  const filtered = newSelection.filter(item => !isDuplicate(item));
  if (filtered.length !== newSelection.length) {
    selectedImportItems.value = filtered;
  }
});

onMounted(() => { // permet de supp la focntion de selectioneer/deselectionner tout les items car mal fais, donc c'est fais avec des boutons
  setTimeout(() => {
    const th = document.querySelector('.va-data-table__table-thead--sticky tr.va-data-table__table-tr th.va-data-table__table-cell-select');
    if (th) {
      const checkboxContainer = th.querySelector('.va-message-list-wrapper.va-checkbox');
      if (checkboxContainer) {
        checkboxContainer.remove(); // supprime uniquement l'élément enfant contenant la checkbox
      }
    }
  }, 100);
});

// désactiver (et barrer) les lignes duplicata
const rowBind = (row) => {
  if (isDuplicate(row)) {
    return {
      class: 'duplicate-row',
      style: {
        pointerEvents: 'none',
        opacity: 0.5,
        textDecoration: 'line-through'
      }
    };
  }
  return {};
};

const cancelImport = () => {
  emit("cancelImport");
};

const confirmImport = () => {
  // émet uniquement les items sélectionnés par l'utilisateur
  emit("confirmImport", selectedImportItems.value);
};
</script>

<style scoped>
.import-modal {
  display: flex;
  flex-direction: column;
  height: 600px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.search-container {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  max-width: 400px;
}

.select-all-container {
  margin-bottom: 15px;
  text-align: right;
}

.select-all-container>.va-button {
  margin-left: 10px;
}

.datatable-container {
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.no-participants-alert {
  margin-top: 15px;
}

.gender-icon {
  font-size: 18px;
  color: #007bff;
}

.nationality-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nationality-flag {
  width: 20px;
  height: auto;
  vertical-align: middle;
}

.duplicate-row {
  text-decoration: line-through;
  opacity: 0.5;
}

.duplicate-status {
  color: #ff4d4f;
  /* rouge pour les duplicata */
  font-weight: bold;
}

.available-status {
  color: #52c41a;
  /* vert pour les disponibles */
  font-weight: bold;
}

.import-summary {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}
</style>