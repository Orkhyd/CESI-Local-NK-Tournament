<template>
  <!-- carte representant un tournoi -->
  <VaCard class="tournament-card">
    <!-- en tete avec une icone et le nom du tournoi -->
    <div class="card-header">
      <VaIcon name="emoji_events" class="icon-tournament" /> 
      <VaCardTitle class="tournament-title">{{ tournoi.name }}</VaCardTitle> 
    </div>

    <!-- contenu de la carte : date du tournoi -->
    <VaCardContent>
      <div class="info">
        <VaIcon name="event" class="icon" /> 
        <span class="info-text">debut : {{ tournoi.startDate }}</span> 
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup>
// props pour recevoir les donnees du tournoi
defineProps({ tournoi: Object });
</script>

<style scoped>
/* style global de la carte */
.tournament-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  text-align: center;
  padding: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

/* effet de survol sur la carte */
.tournament-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

/* style de l en tete avec l icone et le nom du tournoi */
.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 16px;
}

/* style de l icone du tournoi */
.icon-tournament {
  font-size: 36px;
  color: #d50708;
}

/* style du nom du tournoi */
.tournament-title {
  font-size: 22px;
  font-weight: 600;
  color: #0c2432;
}

/* style du bloc d information */
.info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  margin-top: 10px;
}

/* style de l icone de la date */
.icon {
  font-size: 20px;
  color: #0c2432;
}

/* style du texte d information */
.info-text {
  color: #444;
  font-weight: 500;
}
</style>