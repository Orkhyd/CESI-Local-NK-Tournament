<template>
  <VaModal
    v-model="isOpen"
    hide-default-actions
    class="tournament-modal"
  >
    <VaCard class="modal-card">
      <VaCardTitle class="modal-title">
        <VaIcon name="emoji_events" class="modal-icon" />
        Créer un tournoi
      </VaCardTitle>

      <VaCardContent>
        <VaInput
          v-model="tournoiNom"
          label="Nom du tournoi"
          placeholder="Entrez le nom du tournoi"
          class="input-field"
          :rules="[v => !!v || 'Le nom du tournoi est requis']"
        >
          <template #prependInner>
            <VaIcon name="sports_martial_arts" class="input-icon" />
          </template>
        </VaInput>

        <VaInput
          v-model="dateDebut"
          label="Date de debut"
          type="date"
          class="input-field"
          :rules="[v => !!v || 'La date de debut est requise']"
        >
          <template #prependInner>
            <VaIcon name="event" class="input-icon" />
          </template>
        </VaInput>
      </VaCardContent>

      <VaCardActions align="right" class="modal-actions">
        <VaButton color="danger" outline @click="closeModal">Annuler</VaButton>
        <VaButton
          color="primary"
          :disabled="!isFormValid"
          @click="createTournoi"
        >
          Créer
        </VaButton>
      </VaCardActions>
    </VaCard>
  </VaModal>
</template>

<script setup>
// imports necessaires
import { ref, computed, defineEmits } from "vue";
import { useToast } from "vuestic-ui";

// gestion des notifications toast
const toast = useToast();

// variables reactives
const isOpen = ref(false); // controle l ouverture de la modale
const tournoiNom = ref(""); // stocke le nom du tournoi
const dateDebut = ref(""); // stocke la date de debut

// emission d evenements pour communiquer avec le parent
const emit = defineEmits(["create", "close"]);

// validation du formulaire
const isFormValid = computed(() => {
  return tournoiNom.value.trim() !== "" && dateDebut.value.trim() !== "";
});

// fonction pour fermer la modale
const closeModal = () => {
  isOpen.value = false; // ferme la modale
  emit("close"); // emet l evenement close
};

// fonction pour creer un tournoi
const createTournoi = () => {
  if (isFormValid.value) {
    // cree un nouvel objet tournoi
    const newTournoi = {
      id: Date.now(), // genere un id unique
      nom: tournoiNom.value.trim(), // nom du tournoi
      dateDebut: dateDebut.value, // date de debut
      combats: [], // liste des combats (vide par defaut)
      participants: [], // liste des participants (vide par defaut)
    };

    emit("create", newTournoi); // emet l evenement create avec le nouveau tournoi
    toast.init({ message: "tournoi cree avec succes", color: "success" }); // affiche une notification de succes
    closeModal(); // ferme la modale
  } else {
    toast.init({ message: "veuillez remplir tous les champs", color: "danger" }); // affiche une notification d erreur
  }
};

// fonction pour ouvrir la modale depuis le parent
const open = () => {
  isOpen.value = true; // ouvre la modale
};

// expose la fonction open pour qu elle soit utilisable depuis le parent
defineExpose({ open });
</script>

<style scoped>
/* style general de la modale */
.tournament-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh; /* assure que la modale est centree verticalement */
  width: 100%;
  background: rgba(0, 0, 0, 0.3); /* fond semi transparent */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000; /* assure que la modale est au dessus des autres elements */
}

/* style de la carte contenant le formulaire */
.modal-card {
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  background: #ffffff;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
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