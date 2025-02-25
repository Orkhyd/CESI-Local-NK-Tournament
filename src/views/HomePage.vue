<template>

  <VaButton color="secondary" class="test-btn" @click="goToTableau">Test Tableau</VaButton>


  <div class="home-wrapper">
    <!-- titre principal -->
    <h1 class="title">Accueil du Tournoi</h1>

    <!-- affichage conditionnel : tournoi existant ou non -->
    <div v-if="tournoi">
      <!-- sous-titre pour le tournoi en cours -->
      <h2 class="subtitle">Tournoi en cours :</h2>

      <!-- composant pour afficher les détails du tournoi -->
      <TournamentCard :tournoi="tournoi" />

      <!-- boutons pour continuer ou supprimer le tournoi -->
      <div class="button-group">
        <VaButton color="primary" @click="loadTournoi"> Continuer </VaButton>
        <VaButton color="danger" @click="openDeleteModal"> Supprimer </VaButton>
      </div>
    </div>

    <!-- affichage si aucun tournoi n'est trouvé -->
    <div v-else>
      <h2 class="subtitle">Aucun tournoi trouvé</h2>
      <VaButton color="primary" class="create-btn" @click="openModal"> Créer un Tournoi </VaButton>
    </div>

    <!-- modale de création de tournoi -->
    <TournamentModal ref="tournamentModal" @create="handleCreateTournoi" />

    <!-- modale de confirmation de suppression -->
    <VaModal v-model="isDeleteModalOpen" hide-default-actions class="tournament-modal">
      <div class="modal-card">
        <!-- titre et icône de la modale -->
        <div class="modal-title">
          <VaIcon name="warning" class="modal-icon" />
          Confirmation
        </div>

        <!-- corps de la modale -->
        <div class="modal-body">
          <p class="modal-text">Êtes-vous sûr de vouloir supprimer ce tournoi ?</p>
          <p class="modal-warning">Toutes les données seront perdues.</p>
        </div>

        <!-- boutons d'action de la modale -->
        <div class="modal-actions">
          <VaButton color="secondary" outline @click="closeDeleteModal">Annuler</VaButton>
          <VaButton color="danger" :loading="isDeleting" @click="resetTournoi">Supprimer</VaButton>
        </div>
      </div>
    </VaModal>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------------
// imports
// ------------------------------------------------------------------------------------

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { TournamentService } from "@/replicache/services/tournamentService";
import { getTournaments } from "@/replicache/stores/tournamentStore";
import TournamentCard from "@/components/TournamentCard.vue";
import TournamentModal from "@/components/TournamentModal.vue";
import { rep } from "@/replicache/stores/tournamentStore"; 

// ------------------------------------------------------------------------------------
// initialisation des variables
// ------------------------------------------------------------------------------------

const router = useRouter();
const tournoi = ref(null); // stocke les données du tournoi actuel
const tournamentModal = ref(null); // référence vers la modale de création de tournoi
const isDeleteModalOpen = ref(false); // état de la modale de suppression
const isDeleting = ref(false); // état de chargement lors de la suppression


// ------------------------------------------------------------------------------------
// hooks
// ------------------------------------------------------------------------------------

// Au montage du composant, récupère le dernier tournoi depuis Replicache
onMounted(async () => {
  const tournaments = await getTournaments(rep);
  tournoi.value = tournaments.length > 0 ? tournaments[0] : null;
});

// ------------------------------------------------------------------------------------
// fonctions
// ------------------------------------------------------------------------------------

// ouvre la modale de création de tournoi
const openModal = () => {
  tournamentModal.value.open();
};

// pour dev test la page de tableau
const goToTableau = () => {
  router.push("/bracket-page");
};

// gere la création d'un nouveau tournoi avec Replicache
const handleCreateTournoi = async (newTournoi) => {
  const id = crypto.randomUUID(); // Génère un ID unique
  try {
    await TournamentService.create(id, newTournoi.name, newTournoi.startingDate);
    console.log("Tournoi créé avec succès !");

    // recup les tournois après la création
    const tournaments = await getTournaments(rep);
    console.log("Tournois récupérés :", tournaments);

    // met à jour la référence du tournoi actif
    tournoi.value = tournaments.length > 0 ? tournaments[0] : null;
  } catch (error) {
    console.error("Erreur lors de la création du tournoi :", error);
  }
};

// redirige vers la page du tournoi en cours
const loadTournoi = () => {
  if (tournoi.value) {
    router.push({ path: `/tournament/${tournoi.value.id}` }); // redirection avec l'ID du tournoi
  }
};

// ouvre la modale de confirmation de suppression
const openDeleteModal = () => {
  isDeleteModalOpen.value = true;
};

// ferme la modale de suppression
const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

// supp le tournoi et ferme la modale avec une animation fluide
const resetTournoi = async () => {
  isDeleting.value = true; // active l'état de chargement
  await TournamentService.delete(tournoi.value.id); // supp le tournoi dans Replicache
  tournoi.value = null; // reinit les données du tournoi
  isDeleteModalOpen.value = false;
  isDeleting.value = false;
};
</script>

<style scoped>
/* ------------------------------------------------------------------------------------ */
/* styles globaux */
/* ------------------------------------------------------------------------------------ */

/* wrapper principal centré */
.home-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
}

/* ------------------------------------------------------------------------------------ */
/* styles des titres */
/* ------------------------------------------------------------------------------------ */

.title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #0c2432;
}

.subtitle {
  font-size: 20px;
  font-weight: 500;
  color: #555;
  margin-bottom: 16px;
}

/* ------------------------------------------------------------------------------------ */
/* styles des boutons */
/* ------------------------------------------------------------------------------------ */

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
}

.create-btn {
  margin-top: 20px;
  font-size: 18px;
  padding: 10px 20px;
}

.test-btn {
  margin: 20px;
  font-size: 16px;
  width: 200px;
  padding: 8px 16px;
}


/* ------------------------------------------------------------------------------------ */
/* styles de la modale de suppression */
/* ------------------------------------------------------------------------------------ */

.tournament-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.modal-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
}

/* titre et icône de la modale */
.modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  gap: 10px;
}

.modal-icon {
  font-size: 30px;
  color: #d50708;
}

/* texte de la modale */
.modal-body {
  text-align: center;
}

.modal-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.modal-warning {
  font-size: 14px;
  color: #d50708;
  font-weight: bold;
  margin-bottom: 15px;
}

/* boutons de la modale */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
</style>