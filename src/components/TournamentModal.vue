<template>
  <VaModal v-model="isModalOpen" hide-default-actions class="tournament-modal" size="small">
      <VaCardTitle class="modal-title">
        <VaIcon name="emoji_events" class="modal-icon" />
        Créer un tournoi
      </VaCardTitle>

      <VaCardContent class="contenu-card">
        <VaInput v-model="tournamentName" label="Nom du tournoi" placeholder="Entrez le nom du tournoi" class="input-field"
          counter :max-length="50" :rules="[
            v => !!v || 'Le nom du tournoi est requis',
            v => (v.length <= 50) || 'Maximum 50 caractères'
          ]" @input="tournamentName = tournamentName.slice(0, 50)">
          <template #prependInner>
            <VaIcon name="sports_martial_arts" class="input-icon" />
          </template>
        </VaInput>

        <!-- date de début -->
        <div class="date-picker-title">DATE DE DEBUT :</div>
        <VaDatePicker
          v-model="startingDate"
          mode="single"
          :month-names="monthNamesFull"
          first-weekday="Monday"
          show-other-months
          :allowed-days="(date) => date.getTime() >= new Date().setHours(0, 0, 0, 0)"
          class="date-picker"
        />
      </VaCardContent>

      <VaCardActions align="right" class="modal-actions">
        <VaButton color="danger" outline @click="closeModal">Annuler</VaButton>
        <VaButton color="primary" :disabled="!isFormValid" @click="createTournoi">
          Créer
        </VaButton>
      </VaCardActions>
  </VaModal>
</template>

<script setup>
// ------------------------------------------------------------------------------------
// imports
// ------------------------------------------------------------------------------------

import { ref, computed } from "vue";
import { useToast } from "vuestic-ui";

// ------------------------------------------------------------------------------------
// initialisation des variables
// ------------------------------------------------------------------------------------

const toast = useToast();
const tournamentName = ref(""); // stocke le nom du tournoi
const startingDate = ref(new Date()); // date
const isModalOpen = true;

// emission d'événements pour communiquer avec le parent
const emit = defineEmits(["create", "close"]);

// validation du formulaire
const isFormValid = computed(() => {
  return tournamentName.value.trim() !== "" && startingDate.value instanceof Date;
});

// ferme la modale
const closeModal = () => {
  emit("close"); // emmet l'événement close
};

// cree un tournoi
const createTournoi = () => {
  if (isFormValid.value) {
    // cree un nouvel objet tournoi
    const newTournoi = {
      name: tournamentName.value.trim(), // nnom du tournoi
      startingDate: startingDate.value, // date de début
    };

    emit("create", newTournoi); // emet l  événement create avec le nouveau tournoi
    toast.init({ message: "Tournoi créé avec succès", color: "success" , position: 'bottom-center'}); // affiche une notification de succès
    closeModal(); // Ferme la modale
  } else {
    toast.init({ message: "Veuillez remplir tous les champs", color: "danger", position: 'bottom-center' }); // Aaffiche une notification d'erreur
  }
};

const monthNamesFull = [ "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ];

// expose la fonction open pour qu'elle soit utilisable depuis le parent
defineExpose({ open });
</script>

<style scoped>
/* style general de la modale */
.tournament-modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.contenu-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  align-items: center;
}

/* style du titre au-dessus du Date Picker */
.date-picker-title {
  text-align: center;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #0c2432;
}

/* centrer le Date Picker */
.date-picker-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

/* style du titre de la modale */
.modal-title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: bold;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

/* style de l icone du titre */
.modal-icon {
  font-size: 26px;
  color: #d50708;
}

/* style des champs de saisie */
.input-field {
  margin-bottom: 15px;
  width: 100%;
}

/* style des icones dans les champs */
.input-icon {
  font-size: 20px;
  color: #0c2432;
}

/* style des boutons d actions */
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>