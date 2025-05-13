<template>
  <div class="participants-overlay">
    <div class="close-icon-div">
      <VaIcon name="close" class="close-icon" @click="emit('close')"/>
    </div>
    <div class="header-fixed">
        <div class="header-actions">
          <!-- filtres -->
          <div class="filter-controls">
            <VaInput v-model="searchQuery" placeholder="Rechercher un participant..." class="search-input" />
            <VaCheckbox v-model="hideEliminated" label="Participants non éliminés" />
          </div>

        </div>
    </div>


    <!-- liste des participants -->
    <div class="scrollable-list">
      <VaList>
        <VaListItem v-for="participant in filteredParticipants" :key="participant.id" class="participant-item"
          @click="emitParticipantId(participant.id)"
          title="Cliquer pour afficher le participant dans le tabelau d'élimination.">
          <VaListItemSection avatar>
            <VaAvatar :class="participant.isEliminated ? 'eliminated' : 'in-game'">
              <img v-if="getCountry(participant.nationalityId)"
                :src="getFlag(getCountry(participant.nationalityId))" alt="flag" class="nationality-flag" />
            </VaAvatar>
          </VaListItemSection>

          <VaListItemSection>
            <VaListItemLabel>
              {{ participant.firstName }} {{ participant.lastName }}
            </VaListItemLabel>
            <VaListItemLabel caption>
              {{ participant.clubName }}
            </VaListItemLabel>
            <VaListItemLabel caption>
              Grade: {{ getGradeName(participant.gradeId) }}
            </VaListItemLabel>
            <VaListItemLabel caption>
              Genre: {{ getGenderName(participant.genderId) }}
            </VaListItemLabel>
          </VaListItemSection>
        </VaListItem>
      </VaList>
    </div>

    <!-- légende  -->
    <div class="legend-container">
      <div class="legend-item">
        <span class="legend-circle in-game"></span> Participant non éliminé
      </div>
      <div class="legend-item">
        <span class="legend-circle eliminated"></span> Participant éliminé
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { grades, genders, nationality } from '@/replicache/models/constants';
import { useCountryFlags } from '@/utils/countryFlags';

const props = defineProps({
    participants: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits(['find-participant' , 'close']);

const searchQuery = ref('');
const hideEliminated = ref(false);

const filteredParticipants = computed(() => {
    return props.participants
        .filter((participant) => {
            const matchesSearch = `${participant.firstName} ${participant.lastName}`
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase());
            const isNotEliminated = !hideEliminated.value || !participant.isEliminated;
            return matchesSearch && isNotEliminated;
        })
        .sort((a, b) => a.isEliminated - b.isEliminated); // triie les non éliminés en premier
});


const getCountry = (natId) => {
    return nationality.find(country => Number(country.id) === Number(natId));
};

const { getFlag } = useCountryFlags();


const getGradeName = (gradeId) => {
    const grade = grades.find((g) => Number(g.id) === Number(gradeId));
    return grade ? grade.nom : 'Inconnu';
};

const getGenderName = (genderId) => {
    const gender = genders.find((g) => Number(g.id) === Number(genderId));
    return gender ? gender.nom : 'Inconnu';
};

const emitParticipantId = (id) => {
    emit('find-participant', {idParticipant: id, randomNumber: Math.random()} );
    emit('close');
};
</script>

<style scoped>
.participants-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 250px;
  height: 100%;
  background: white;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  color: black;
}

.header-fixed {
  width: 250px;
  background: white;
  padding: 5px;
  z-index: 1001;
  padding-bottom: 10px;

}

.scrollable-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-top:  5px;
  padding-bottom: 10px;
}


.legend-container {
  display: flex;
  flex-direction: column;
  bottom: 10px;
  right: 20px;
  width: 250px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  font-weight: 600;
}

.legend-item {
  display: flex;
  align-items: center;
  padding-bottom: 5px;
  gap: 5px;
  font-size: 12px;
}

.legend-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.in-game {
  background-color: #2ecc71 !important;
}

.eliminated {
  background-color: #e74c3c !important;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 5px;
  padding-left: 10px;
}

.close-icon {
  font-size: 22px !important;
  cursor: pointer;
  color: #333;
  transition: color 0.3s ease;
  margin: 5px;
}

.close-icon-div {
  display: flex;
  justify-content: flex-end;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

.close-icon:hover {
  color: #e74c3c;
}

.participant-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  font-size: 12px;
}

.participant-item:hover {
  background-color: #f0f0f0;
}

.VaListItemSection {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.VaListItemLabel {
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.VaListItemLabel.caption {
  font-size: 11px;
  color: gray;
  white-space: normal;
}

.nationality-flag {
  width: 24px;
  height: 16px;
  border-radius: 3px;
  object-fit: cover;
  display: block;
  border: 1px solid white;
}

</style>
