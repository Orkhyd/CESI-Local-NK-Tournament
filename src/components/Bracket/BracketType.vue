<template>
  <div class="bracket-page">
    <!-- affichage du message de chargement si les donnees ne sont pas encore disponibles -->
    <div v-if="isLoading">Chargement...</div>

    <!-- affichage du bracket une fois charge, avec une cle unique pour forcer le rafraichissement -->
    <div v-else>
      <Bracket 
        v-if="bracket" 
        :bracket="bracket" 
        :participants="participants"
        :key="bracket.id"
        @update="updateData"
        :searchParticipant="props.searchParticipant" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { bracketService } from "@/replicache/services/Bracket/bracketService";
import { getBracketByCategory } from "@/replicache/stores/Bracket/bracketStore"; 
import Bracket from "./Bracket.vue";

const props = defineProps({
  tournamentId: {
    type: String,
    required: true,
  },
  category: {
    type: Object,
    required: true,
  },
  participants: {
    type: Array,
    required: true,
  },
  searchParticipant: {
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update']);

const bracket = ref(null);
const isLoading = ref(true);

const updateData = async () => {
  emit('update');
}

/**
 * charge le bracket existant ou en crée un nouveau si nécessaire
 */
const loadOrCreateBracket = async () => {
  try {
    isLoading.value = true;

    // verif si un bracket existe déjà pour cette catégorie
    const existingBracket = await getBracketByCategory(props.category.id);

    if (existingBracket) {
      bracket.value = existingBracket;
      isLoading.value = false;
      return;
    }

    // veriif qu'il y a assez de participants pour créer un bracket
    if (props.participants.length < 2) {
      console.warn("⚠️ Pas assez de participants pour créer un bracket !");
      isLoading.value = false;
      return;
    }

    // crée un nouveau bracket
    const bracketId = await bracketService.create(props.category.id, props.participants);

    // recup le bracket mis à jour
    bracket.value = await getBracketByCategory(props.category.id);
    isLoading.value = false;
  } catch (error) {
    console.error("❌ Erreur lors du chargement du bracket :", error);
    isLoading.value = false;
  }
};


/**
 * init le bracket au montage du composant
 */
onMounted(() => {
  loadOrCreateBracket();
});

</script>

<style scoped>
.bracket-page {
  text-align: center;
  padding: 10px;
  max-height: 82vh; /* empêche le dépassement vertical */
  overflow-y: auto; /* scroll vertical */
  overflow-x: auto; /* empêche un mini scroll horizontal parasite */
  white-space: nowrap; /* évite le retour à la ligne des éléments enfants */
  scrollbar-gutter: stable; /* empêche le décalage du contenu quand le scroll apparaît */
}
</style>
