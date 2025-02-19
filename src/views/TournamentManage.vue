<template>
  <div class="manage-wrapper">
    <!-- bloc des categories -->
    <div class="manage-section categories-section">
      <div class="section-header">
        <h2 class="section-title">Catégories</h2>
        <VaButton color="primary" icon="add" @click="openCategoryModal">Créer une categorie</VaButton>
      </div>
      <CategoriesList 
        :categories="categories" 
        @add="openCategoryModal" 
        @edit="openEditCategoryModal" 
        @delete="deleteCategory" 
      />
    </div>

    <!-- bloc des participants -->
    <div class="manage-section participants-section">
      <div class="section-header">
        <h2 class="section-title">Participants</h2>
        <VaButton color="primary" icon="add" @click="openParticipantModal">Ajouter un participant</VaButton>
      </div>
      <ParticipantsList 
        :participants="participants" 
        @edit="openEditParticipant" 
        @delete="deleteParticipantFromDB" 
      />
    </div>

    <!-- modales -->
    <ParticipantModal ref="participantModal" @save="handleAddParticipant" />
    <CategorieModal ref="categoryModal" @save="handleSaveCategory" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import ParticipantsList from "@/components/ParticipantsList.vue";
import CategoriesList from "@/components/CategoriesList.vue";
import ParticipantModal from "@/components/ParticipantModal.vue";
import CategorieModal from "@/components/CategorieModal.vue";
import { 
  addCategorie, 
  deleteCategorie, 
  addParticipant, 
  deleteParticipantFromDB,
  addParticipantToTournoi, 
  getLastTournoi ,
  getAllParticipants,
  addParticipantToCategorie,
  getAllCategories,
  removeParticipantsFromCategorie 
} from "@/store/tournoiStore";

const participants = ref([]);
const categories = ref([]);
const participantModal = ref(null);
const categoryModal = ref(null);
const currentTournoi = ref(null);

// charge les donnees au montage du composant
onMounted(async () => {
  currentTournoi.value = await getLastTournoi(); // charge le tournoi actif
  if (currentTournoi.value) {
    participants.value = await getAllParticipants();
    categories.value = await getAllCategories();
  }
});

// ouvre la modale d edition d un participant
const openEditParticipant = (participant) => {
  participantModal.value.openEdit(participant);
};

// ouvre la modale d ajout de participant
const openParticipantModal = () => participantModal.value.open();

// ouvre la modale d ajout de categorie
const openCategoryModal = () => categoryModal.value.open();

// ouvre la modale d edition de categorie
const openEditCategoryModal = (category) => categoryModal.value.openEdit(category);

// ajoute un participant et l associe au tournoi actif
const handleAddParticipant = async (participant) => {
    const savedParticipant = await addParticipant(participant);
    participants.value.push(savedParticipant);

    if (!currentTournoi.value) {
      console.error("aucun tournoi actif trouve");
      return;
    }
    
    await addParticipantToTournoi(currentTournoi.value.id, savedParticipant.id);
};

// supprime un participant et met a jour la liste
const removeParticipant = async (participantId) => {
  await deleteParticipantFromDB(participantId);
  participants.value = participants.value.filter(p => p.id !== participantId);
};

// enregistre une categorie avec mise a jour des participants associes
const handleSaveCategory = async (category) => {
  const index = categories.value.findIndex(c => c.id === category.id);

  if (index !== -1) {
    categories.value[index] = category; // maj si existe deja
  } else {
    await addCategorie(category); // ajout d une nouvelle categorie
    categories.value = await getAllCategories(); // recharge la liste
  }

  await removeParticipantsFromCategorie(category.id); // supprime anciennes associations

  for (const participantId of category.selectedParticipants) {
    await addParticipantToCategorie(category.id, participantId); // associe les participants
  }
};

// supprime une categorie et met a jour la liste
const deleteCategory = async (categoryId) => {
  await deleteCategorie(categoryId);
  categories.value = categories.value.filter(c => c.id !== categoryId);
};
</script>

<style scoped>
.manage-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}

.manage-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.categories-section {
  flex: 1;
  border-bottom: 2px solid var(--va-background-border);
}

.participants-section {
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 22px;
  font-weight: bold;
  color: var(--va-text-primary);
}

.va-button {
  font-size: 14px;
  font-weight: 600;
}
</style>
