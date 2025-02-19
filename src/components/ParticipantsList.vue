<template>
  <!-- carte pour afficher la liste des participants -->
  <VaCard class="participants-card">
    <!-- enTTete de la carte avec une icone et un titre -->
    <VaCardTitle class="card-header">
      <VaIcon name="users" class="title-icon" /> <!-- icone pour representer les participants -->
      participants <!-- titre de la carte -->
    </VaCardTitle>

    <!-- contenu de la carte -->
    <VaCardContent>
      <!-- tableau pour afficher les participants -->
      <VaDataTable
        :items="participants" 
        :columns="columns" 
        class="participants-table" 
        striped 
        hoverable 
        no-data-html="aucun participant trouve." 
      >
        <!-- colonne nom et prenom -->
        <template #cell(nom)="{ rowData }">
          <div class="participant-name">
            <VaIcon name="person" class="cell-icon" /> 
            {{ rowData.nom }} {{ rowData.prenom }} 
          </div>
        </template>

        <!-- colonne club -->
        <template #cell(club)="{ rowData }">
          <div class="participant-club">
            <VaIcon name="location_city" class="cell-icon" /> 
            {{ rowData.club || "non renseigne" }}
          </div>
        </template>

        <!-- colonne sexe -->
        <template #cell(sexe)="{ rowData }">
          <VaChip color="info" size="small"> 
            <VaIcon name="transgender" class="chip-icon" /> 
            {{ rowData.sexe?.text || "non specifie" }} 
          </VaChip>
        </template>

        <!-- colonne poids -->
        <template #cell(poids)="{ rowData }">
          <div class="participant-poids">
            <VaIcon name="fitness_center" class="cell-icon" /> 
            {{ rowData.poids ? `${rowData.poids} kg` : "non renseigne" }} 
          </div>
        </template>

        <!-- colonne date de naissance -->
        <template #cell(dateNaissance)="{ rowData }">
          <div class="participant-date">
            <VaIcon name="calendar_today" class="cell-icon" /> 
            {{ formatDate(rowData.dateNaissance) }} 
          </div>
        </template>

        <!-- colonne gradee -->
        <template #cell(grade)="{ rowData }">
          <VaChip color="warning" size="small"> 
            <VaIcon name="sports_martial_arts" class="chip-icon" /> 
            {{ rowData.grade?.text || "aucun" }}
          </VaChip>
        </template>

        <!-- colonne actions (modifier / supprimer) -->
        <template #cell(actions)="{ rowData }">
          <div class="actions">
            <!-- bouton pour modifier un participant -->
            <VaButton icon="edit" color="warning" size="small" @click="editParticipant(rowData)" />
            <!-- bouton pour supprimer un participant -->
            <VaButton icon="delete" color="danger" size="small" @click="deleteParticipant(rowData.id)" />
          </div>
        </template>
      </VaDataTable>
    </VaCardContent>
  </VaCard>
</template>

<script setup>
// imports necessaires
import { defineProps, defineEmits, computed } from "vue";

// props pour recevoir la liste des participants
const props = defineProps({
  participants: Array,
});

// emission d evenements pour communiquer avec le parent
const emit = defineEmits(["edit", "delete"]);

// colonnes du tableau
const columns = computed(() => [
  { key: "nom", label: "nom & prenom", sortable: true },
  { key: "club", label: "club", sortable: true },
  { key: "sexe", label: "sexe", sortable: false },
  { key: "poids", label: "poids", sortable: false },
  { key: "dateNaissance", label: "date de naissance", sortable: false },
  { key: "grade", label: "grade", sortable: false },
  { key: "actions", label: "actions", sortable: false },
]);

// fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "non renseigne";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};

// fonction pour emettre l evenement de modification
const editParticipant = (participant) => emit("edit", participant);

// fonction pour emettre l evenement de suppression
const deleteParticipant = (participantId) => emit("delete", participantId);
</script>

<style scoped>
/* style global de la carte */
.participants-card {
  width: 100%;
  border-radius: 12px;
  background: var(--va-background-primary);
  box-shadow: var(--va-box-shadow);
  padding: 16px;
}

/* style de l en tete de la carte */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: var(--va-text-primary);
}

/* style du tableau */
.participants-table {
  width: 100%;
  border-radius: 8px;
}

/* style des icones */
.title-icon {
  font-size: 22px;
  color: var(--va-primary);
}

.cell-icon {
  margin-right: 6px;
  color: var(--va-secondary);
}

/* style des informations dans les cellules */
.participant-name,
.participant-club,
.participant-poids,
.participant-date {
  display: flex;
  align-items: center;
  font-size: 14px;
}

/* style des chips */
.chip-icon {
  margin-right: 4px;
}

/* style des boutons d actions */
.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>