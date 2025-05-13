<template>
  <!-- carte du tournament -->
  <VaCard class="tournament-card" :gradient="true">
    <!-- entete avec icoone, nom et statut -->
    <div class="card-header">
      <!-- icone principale -->
      <VaIcon name="sports_martial_arts" class="icon-tournament" :gradient="true" :size="60" color="#0c2432" />

      <!-- nom du tournament -->
      <VaCardTitle class="tournament-title">{{ tournament.name }}</VaCardTitle>
    </div>

    <!-- details du tournament -->
    <VaCardContent class="card-content">
      <!-- date de début -->
      <div class="info">
        <VaIcon name="event" class="icon" :size="20" color="#0c2432" />
        <span class="info-text">Début : {{ formatDate(tournament.startDate) }}</span>
      </div>

      <!-- adresse du tournoi -->
      <div class="info">
        <VaIcon name="home" class="icon" :size="20" color="#0c2432" />
        <span class="info-text">Adresse : {{ tournament.address }}</span>
      </div>

      <!-- etat du tournament -->
      <div class="status-container">
        <VaChip :color="tournament.started ? '#0c2432' : 'warning'" class="status-badge">
          <VaIcon :name="tournament.started ? 'check_circle' : 'hourglass_empty'" class="status-icon" />
          {{ tournament.started ? 'Tournoi en cours' : 'Non commencé' }}
        </VaChip>

        <!-- progress Circle si le tournament est commencé -->
        <VaProgressCircle v-if="tournament.started" indeterminate :size="40" :thickness="0.2" color="#0c2432"
          class="progress-circle" />
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup>

// props pour recevoir les données du tournament
defineProps({ tournament: Object });

// fction pour formater la date
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString("fr-FR", options);
};
</script>

<style scoped>
/* carte globale */
.tournament-card {
  width: 100%;
  max-width: 450px;
  background: linear-gradient(135deg, #0c2432, #166d9a);
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  padding: 24px;
  color: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  position: relative;
}

/* effet de survol */
.tournament-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.25);
}

/* enttete avec icône et nom */
.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

/* icone principale */
.icon-tournament {
  font-size: 80px;
  color: #0c2432;
  animation: float 3s ease-in-out infinite;
}

/* animation de flottement pour l'icone */
@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

/* nom du tournament */
.tournament-title {
  font-size: 24px;
  font-weight: 700;
  color: #0c2432;
  word-wrap: break-word;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* seection des infos */
.info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 18px;
  margin-top: 12px;
}

/* icone de date */
.icon {
  color: #0c2432;
}

/* texte de la date */
.info-text {
  font-weight: 500;
  color: black;
}

/* conteneur du statut */
.status-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

/* badge de statut */
.status-badge {
  font-size: 14px;
  font-weight: bold;
  padding: 8px 12px;
}

/* icoone de statut */
.status-icon {
  font-size: 18px;
  margin-right: 4px;
}
</style>