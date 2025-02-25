<template>
  <VaDataTable :items="participants" :columns="columns" striped>
    <!-- Ajouter une colonne pour les actions -->
    <template #cell(actions)="{ row }">
      <VaButton @click="editParticipant(row)" color="primary" class="mr-2">
        Éditer
      </VaButton>
      <VaButton @click="deleteParticipant(row)" color="danger">
        Supprimer
      </VaButton>
    </template>
  </VaDataTable>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  participants: Array,
});

const emit = defineEmits(['edit', 'delete']);

// colonnes du tableau
const columns = [
  { key: "firstName", label: "Nom" },
  { key: "lastName", label: "Prénom" },
  { key: "birthDate", label: "Date de naissance" },
  { key: "gender", label: "Genre" },
  { key: "grade", label: "Grade" },
  { key: "clubName", label: "Club" },
  { key: "weight", label: "Poids" },
  { key: "nationality", label: "Nationalité" },
  { key: "actions", label: "Actions" }, // colonne pour les actions
];

// emet un événement pour edit un participant
const editParticipant = (participant) => {
  emit('edit', participant);
};

// emet un événement pour suppp un participant
const deleteParticipant = (participant) => {
  emit('delete', participant);
};
</script>