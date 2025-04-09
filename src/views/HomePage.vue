<template>
  <div class="home-wrapper">
    <div class="top-section">
      <h1 class="main-title">NK MASTER TOURNAMENT</h1>
    </div>

    <div class="bottom-section">
      <div class="section-title left-title">Tournoi</div>
      <div class="section-title right-title">Scoreboard</div>

      <div class="left-section">
        <img src="@/assets/img/combat-nippon.jpg" alt="Nippon Kempo" class="background-image" />
        <div class="content">
          <div v-if="tournament" class="tournament-content">
            <TournamentCard :tournament="tournament" />
            <div class="button-group">
              <VaButton color="danger" @click="openDeleteModal" class="btn"> Supprimer le tournoi </VaButton>
              <VaButton color="#0c2432" @click="loadTournoi" class="btn"> Accéder au tournoi </VaButton>
            </div>
          </div>
          <div v-else class="no-tournament">
            <VaButton color="#0c2432" @click="openModal" class="create-tournament-btn"> Créer un Tournoi </VaButton>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="background-overlay"></div>
        <div class="content">
          <VaButton color="#0c2432" @click="openFictiveScoreboard" class="fictive-scoreboard-btn">
            Ouvrir Scoreboard Fictif
          </VaButton>
        </div>
      </div>
    </div>

    <TournamentModal v-if="tournamentModalOpen" @create="handleCreateTournoi" @close="tournamentModalOpen = false" />

    <VaModal v-model="isDeleteModalOpen" hide-default-actions class="tournament-modal">
      <div class="modal-card">
        <div class="modal-title">
          <VaIcon name="warning" class="modal-icon" />
          Confirmation
        </div>
        <div class="modal-body">
          <p class="modal-text">Êtes-vous sûr de vouloir supprimer ce tournament ?</p>
          <p class="modal-warning">Toutes les données seront perdues.</p>
        </div>
        <div class="modal-actions">
          <VaButton color="secondary" outline @click="closeDeleteModal">Annuler</VaButton>
          <VaButton color="danger" :loading="isDeleting" @click="resetTournoi">Supprimer</VaButton>
        </div>
      </div>
    </VaModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { TournamentService } from "@/replicache/services/tournamentService";
import { getTournaments } from "@/replicache/stores/tournamentStore";
import TournamentCard from "@/components/TournamentCard.vue";
import TournamentModal from "@/components/TournamentModal.vue";

const router = useRouter();
const tournament = ref(null);
const tournamentModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

onMounted(async () => {
  const tournaments = await getTournaments();
  tournament.value = tournaments.length > 0 ? tournaments[0] : null;
});

const openModal = () => {
  tournamentModalOpen.value = true;
};

const openFictiveScoreboard = () => {
  if (window.electron && window.electron.openFictiveMatchWindow) {
    window.electron.openFictiveMatchWindow("open-fictive-match-window");
  }
};

const handleCreateTournoi = async (newTournoi) => {
  const id = crypto.randomUUID();
  try {
    await TournamentService.createTournament(id, newTournoi.name, newTournoi.address, newTournoi.startingDate);
    const tournaments = await getTournaments();
    tournament.value = tournaments.length > 0 ? tournaments[0] : null;
    tournamentModalOpen.value = false;
    loadTournoi();
  } catch (error) {
    console.error("Erreur lors de la création du tournament :", error);
  }
};

const loadTournoi = () => {
  if (tournament.value) {
    const routePath = tournament.value.started
      ? `/tournament/started/${tournament.value.id}`
      : `/tournament/non-started/${tournament.value.id}`;
    router.push({ path: routePath });
  }
};

const openDeleteModal = () => {
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

const resetTournoi = async () => {
  isDeleting.value = true;
  await TournamentService.deleteTournament(tournament.value.id);
  tournament.value = null;
  isDeleteModalOpen.value = false;
  isDeleting.value = false;
};
</script>

<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ffffff;
  color: #0c2432;
}

.top-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0c2432;
  color: #ffffff;
}

.main-title {
  font-size: 80px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin: 0;
}

.bottom-section {
  flex: 1;
  display: flex;
  padding: 20px;
  background-color: #ffffff;
  gap: 20px;
  position: relative;
}

.section-title {
  position: absolute;
  top: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #0c2432;
}

.left-title {
  left: 20px;
}

.right-title {
  right: 20px;
}

.left-section {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.08;
}

.content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.tournament-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 600px;
}

.no-tournament {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.button-group {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.btn {
  padding: 5px;
}

.right-section {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.right-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("@/assets/img/scoreboard-img.png");
  background-size: cover;
  background-position: center;
  opacity: 0.04;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(12, 36, 50, 0.2);
}

.create-tournament-btn,
.fictive-scoreboard-btn {
  background-color: #0c2432;
  color: #ffffff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.create-tournament-btn:hover,
.fictive-scoreboard-btn:hover {
  background-color: #1a3a4d;
}

.tournament-modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-card {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.modal-title {
  font-size: 24px;
  font-weight: bold;
  color: #0c2432;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.modal-icon {
  color: #ff4444;
}

.modal-body {
  margin: 20px 0;
}

.modal-text {
  font-size: 18px;
  color: #0c2432;
}

.modal-warning {
  font-size: 14px;
  color: #ff4444;
  margin-top: 10px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
</style>
