<template>
  <div>
    <!-- Titre -->
    <h1 class="va-h1">Gestion du Tournoi</h1>

    <!-- Bouton pour ouvrir la modale de création -->
    <VaButton @click="openParticipantModal" class="mb-6">
      Créer un participant
    </VaButton>

    <!-- Modale de création/modification (affichée uniquement si selectedParticipant est défini) -->
    <ParticipantModal
      v-if="selectedParticipant !== null"
      :modelValue="selectedParticipant !== null"
      :participant="selectedParticipant"
      @save="handleSaveParticipant"
      @update:modelValue="closeParticipantModal"
    />

    <!-- Affichage des participants -->
    <ParticipantList
      :participants="formattedParticipants"
      @edit="editParticipant"
      @delete="deleteParticipant"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { VaButton } from 'vuestic-ui';
import ParticipantModal from '../components/ParticipantModal.vue';
import ParticipantList from '../components/ParticipantList.vue';
import { getParticipantsByTournament } from '../replicache/stores/participantStore';
import { ParticipantService } from '../replicache/services/participantService';
import { genders, grades } from '../replicache/models/constants';

export default {
  components: {
    ParticipantModal,
    ParticipantList,
  },
  setup() {
    // recup id tournoi depuis url
    const route = useRoute();
    const tournamentId = computed(() => route.params.id);

    // liste participants
    const participants = ref([]);

    // participant selectionne pr edit ou crea
    const selectedParticipant = ref(null);

    // charge participants depuis bdd
    const refreshParticipants = async () => {
      if (tournamentId.value) {
        participants.value = await getParticipantsByTournament(tournamentId.value);
      }
    };

    // charge participants au montage
    onMounted(refreshParticipants);

    // formate participants en ajoutant nom genre et grade
    const formattedParticipants = computed(() =>
      participants.value.map((p) => ({
        ...p,
        gender: genders.find((g) => Number(g.id) === Number(p.genderId))?.nom || "inconnu",
        grade: grades.find((g) => Number(g.id) === Number(p.gradeId))?.nom || "inconnu",
      }))
    );

    // ouvre modale pr crea participant
    const openParticipantModal = () => {
      selectedParticipant.value = {}; // mode crea
    };

    // ouvre modale pr edit participant
    const editParticipant = (participant) => {
      selectedParticipant.value = participant; // mode edit
    };

    // ferme modale participant
    const closeParticipantModal = () => {
      selectedParticipant.value = null;
    };

    // supprime un participant
    const deleteParticipant = async (participant) => {
      await ParticipantService.delete(participant.id);
      await refreshParticipants();
    };

    // sauvegarde participant modifie ou cree
    const handleSaveParticipant = async (participantData) => {
      const formattedData = {
        ...participantData,
        birthDate: participantData.birthDate ? participantData.birthDate.toISOString().split('T')[0] : null,
        genderId: participantData.genderId?.value || null,
        gradeId: participantData.gradeId?.value || null,
      };

      if (participantData.id) {
        // maj participant existant
        await ParticipantService.update(participantData.id, formattedData);
      } else {
        // cree nouveau participant
        if (!tournamentId.value) {
          return;
        }
        await ParticipantService.create(tournamentId.value, formattedData);
      }

      // rafraichit liste participants
      await refreshParticipants();

      // ferme modale apres sauvegarde
      closeParticipantModal();
    };

    return {
      tournamentId,
      participants,
      formattedParticipants,
      selectedParticipant,
      openParticipantModal,
      editParticipant,
      deleteParticipant,
      handleSaveParticipant,
      closeParticipantModal,
    };
  },
};
</script>

<style scoped>

</style>