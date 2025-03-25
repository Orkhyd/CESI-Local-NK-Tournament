<template>
  <div class="participants-container">
    <div class="table-wrapper">
      <div class="filter-actions">
        <VaInput v-model="filterText" placeholder="Rechercher un participant..." clearable class="filter-input" />
        <input type="file" @change="importFromCSV" accept=".csv" ref="csvInput" class="import-input">
        <VaButton @click="exportToCSV" class="export-button">
          📥 Exporter en CSV
        </VaButton>
        <VaButton @click="emit('create')" class="action-button">
          + Ajouter un participant
        </VaButton>

      </div>

      <VaDataTable :items="filteredParticipants" :columns="columns" class="participants-table" striped sticky-header
        sticky-footer footer-clone no-data-html="Aucun participant trouvé">
        <template #cell(status)="{ row }">
          <VaChip :color="row.source?.categoryId === -1 ? 'danger' : 'success'" class="status-chip">
            {{ row.source?.categoryId === -1 ? "Non attribué" : "Attribué" }}
          </VaChip>
        </template>

        <!-- colonne Genre avec icône -->
        <template #cell(gender)="{ row }">
          <VaIcon
            :name="row.source?.gender === 'Homme' ? 'male' : row.source?.gender === 'Femme' ? 'female' : 'help-circle-outline'"
            :color="row.source?.gender === 'Homme' ? '#007bff' : row.source?.gender === 'Femme' ? '#ff69b4' : 'gray'"
            class="gender-icon" />
        </template>

        <!-- colonne actions avec icônes -->
        <template #cell(actions)="{ row }">
          <VaButton preset="plain" icon="edit" @click="editParticipant(row)" class="action-icon edit-icon" />
          <VaButton preset="plain" icon="delete" color="danger" @click="confirmDelete(row)"
            class="action-icon delete-icon" />
        </template>

        <template #cell(nationalityId)="{ row }">
          <div class="nationality-cell">
            <img v-if="getCountry(row.source.nationalityId)"
              :src="getFlagUrl(getCountry(row.source.nationalityId).flag)" alt="flag" class="nationality-flag" />
            <span>
              {{ getCountry(row.source.nationalityId) ? getCountry(row.source.nationalityId).name :
                row.source.nationalityId }}
            </span>
          </div>
        </template>

        <!-- footer sticky -->
        <template #footer>
          <tr class="sticky-footer">
            <td colspan="4" class="footer-cell">Total Participants: <strong>{{ totalParticipants }}</strong></td>
            <td colspan="3" class="footer-cell">Attribués: <strong>{{ participantsLinked }}</strong></td>
            <td colspan="3" class="footer-cell">Non Attribués: <strong>{{ participantsUnlinked }}</strong></td>
          </tr>
        </template>
      </VaDataTable>

    </div>

    <!-- modale de confirmation de suppression -->
    <VaModal v-model="showDeleteConfirmation" size="small" hide-default-actions>
      <template #content>
        <div class="confirmation-container">
          <p class="modal-text">
            Supprimer le participant <strong>{{ selectedParticipant?.source?.firstName }} {{
              selectedParticipant?.source?.lastName }}</strong> ?
          </p>
          <div class="modal-actions">
            <VaButton color="secondary" @click="showDeleteConfirmation = false"> Annuler </VaButton>
            <VaButton color="danger" @click="deleteConfirmed"> Supprimer </VaButton>
          </div>
        </div>
      </template>
    </VaModal>

  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useToast } from "vuestic-ui";
import { nationality } from "@/replicache/models/constants";

// init vuestic toast
const toast = useToast();
const csvInput = ref(null);

// def props
const props = defineProps({
  participants: Array,
});

// def emits
const emit = defineEmits(["create", "edit", "delete", "import-participant"]);

const getCountry = (natId) => {
  // convertir natId en nombre si necessaire
  return nationality.find(country => country.id === Number(natId));
};

const getFlagUrl = (flagBase64) => {
  return flagBase64 ? `data:image/png;base64,${flagBase64}` : '';
};

// texte filtrage
const filterText = ref("");

// filtrage participants
const filteredParticipants = computed(() => {
  if (!filterText.value) return props.participants.map(p => ({
    ...p,
    status: p.categoryId === -1 ? "Non attribué" : "Attribué", // Ajoutez la propriété `status`
  }));

  const searchLower = filterText.value.toLowerCase();

  return props.participants
    .map((p) => ({
      ...p,
      status: p.categoryId === -1 ? "Non attribué" : "Attribué", // Ajoutez la propriété `status`
    }))
    .filter((p) =>
      Object.values(p).some((val) =>
        val?.toString().toLowerCase().includes(searchLower)
      )
    );
});

// stockage participant suppr
const selectedParticipant = ref(null);
const showDeleteConfirmation = ref(false);

// ouvre modale conf suppr
const confirmDelete = (participant) => {
  selectedParticipant.value = participant;
  showDeleteConfirmation.value = true;
};

// suppr confirmee
const deleteConfirmed = () => {
  if (selectedParticipant.value) {
    emit("delete", selectedParticipant.value);
    showDeleteConfirmation.value = false;
    selectedParticipant.value = null;
  }
};

// import csv
const importFromCSV = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const rows = content.split("\n").map(row => row.replace(/\r$/, "").split(";"));

    const headers = ["firstName", "lastName", "birthDate", "genderId", "gradeId", "clubName", "weight", "nationalityId"];
    const fileHeaders = rows.shift().map(h => h.replace(/"/g, "").trim());

    if (JSON.stringify(fileHeaders) !== JSON.stringify(headers)) {
      toast.init({ message: "Format incorrect : Assurez vous d avoir les bonnes colonnes.", color: "danger", position: 'bottom-center' });
      csvInput.value.value = "";
      return;
    }

    const participants = rows.map(row => {
      if (row.length !== headers.length) return null;

      return {
        firstName: row[0].replace(/"/g, "").trim(),
        lastName: row[1].replace(/"/g, "").trim(),
        birthDate: row[2].replace(/"/g, "").trim(),
        genderId: Number(row[3].replace(/"/g, "")) || null,
        gradeId: Number(row[4].replace(/"/g, "")) || null,
        clubName: row[5].replace(/"/g, "").trim(),
        weight: Number(row[6].replace(/"/g, "")) || null,
        nationalityId: Number(row[7].replace(/"/g, "")) || null,
      };
    }).filter(p => p);

    if (!participants.length) {
      toast.init({ message: "Format incorrect : Assurez vous d'avoir les bonnes colonnes.", color: "danger", position: 'bottom-center' });
      csvInput.value.value = "";
      return;
    }

    emit("import-participant", participants);
    csvInput.value.value = "";
  };

  reader.readAsText(file, "UTF-8");
};

// export csv
const exportToCSV = () => {
  if (!props.participants.length) {
    toast.init({ message: "Aucun participant a exporter !", color: "danger", position: 'bottom-center' });
    console.warn("aucun participant a exporter.");
    return;
  }

  const headers = ["firstName", "lastName", "birthDate", "genderId", "gradeId", "clubName", "weight", "nationalityId"];

  const rows = props.participants.map(p => [
    p.firstName || "",
    p.lastName || "",
    p.birthDate || "",
    p.genderId || "",
    p.gradeId || "",
    p.clubName || "",
    p.weight || "",
    p.nationalityId || ""
  ]);

  let csvContent = "data:text/csv;charset=utf-8," +
    [headers, ...rows].map(row => row.map(value => `"${value}"`).join(";")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
  const fileName = `participants_${formattedDate}.csv`;
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// calc total participants
const totalParticipants = computed(() => props.participants.length);
const participantsLinked = computed(() => props.participants.filter(p => p.categoryId !== -1).length);
const participantsUnlinked = computed(() => props.participants.filter(p => p.categoryId === -1).length);

// editer participant
const editParticipant = (participant) => {
  emit("edit", participant);
};

// def colonnes tableau
const columns = [
  { key: "status", label: "statut", sortable: true },
  { key: "firstName", label: "prenom", sortable: true },
  { key: "lastName", label: "nom", sortable: true },
  { key: "birthDate", label: "date naissance", sortable: true },
  { key: "gender", label: "genre", sortable: true },
  { key: "grade", label: "grade", sortable: true },
  { key: "clubName", label: "club", sortable: true },
  { key: "weight", label: "poids", sortable: true },
  { key: "nationalityId", label: "nationalite", sortable: true },
  { key: "actions", label: "actions", width: "80px" },
];
</script>


<style scoped>
/* conteneur principal */
.participants-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* wrapper de la table */
.table-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.va-data-table__table .va-data-table__table-td) {
  padding: 4px !important;
}

/* sticky footer */
.sticky-footer {
  position: sticky;
  bottom: 0;
  background-color: #ffffff;
  font-weight: bold;
  text-align: center;
  border-top: 2px solid #ccc;
  z-index: 10;
  /* Assurez-vous que le footer est au-dessus des autres éléments */
  width: 100%;
  /* Prend toute la largeur */
}

/* assure tfoot bien affiché */
.va-data-table tfoot {
  background: #ffffff;
  position: sticky;
  bottom: 0;
  z-index: 10;
  width: 100%;
}

/* empeche footer reduit */
.sticky-footer td {
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  color: #0c2432;
  text-align: center;
  width: auto;
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

/* colonnes ajustees */
.va-data-table th,
.va-data-table td {
  font-size: 14px;
  padding: 6px;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 150px;
  white-space: normal;
}

/* icones genre */
.gender-icon {
  font-size: 16px;
  color: gray;
}

/* icones action */
.action-icon {
  font-size: 18px;
  cursor: pointer;
}

.edit-icon {
  color: #2b8a3e;
}

.delete-icon {
  color: #d32f2f;
  margin-left: 8px;
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

/* conteneur aligner filtre et bouton */
.filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
}

/* ajustement champ recherche */
.filter-input {
  width: 30%;
}

/* style bouton */
.action-button {
  white-space: nowrap;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: bold;
  border-radius: 6px;
}

/* alignement boutons */
.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

/* style uniforme boutons */
.import-input,
.export-button,
.action-button {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

/* alignement input file */
.import-input {
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

/* exporter vert */
.export-button {
  background-color: #28a745;
  color: white;
  border: none;
}

.export-button:hover {
  background-color: #218838;
}

/* ajustement de la table */
.participants-table {
  width: 100%;
  overflow: auto;
  height: 65vh;
  display: flex;
  flex-direction: column;
}

/* ajustement des colonnes */
.va-data-table {
  width: 100%;
}

.va-data-table th,
.va-data-table td {
  width: auto;
}
</style>