<template>
  <VaModal v-model="isOpen" hide-default-actions class="modal">
    <div class="modal-card">
      <h2 class="modal-title">
        <VaIcon name="person_add" class="modal-icon" />
        {{ isEditMode ? "Modifier le Participant" : "Ajouter un Participant" }}
      </h2>

      <VaCardContent>
        <div class="form-grid">
          <!-- NOM -->
          <VaInput v-model="nom" clearable label="Nom *" class="input-field" placeholder="Ex: Dupont" />

          <!-- Prénom -->
          <VaInput v-model="prenom" clearable label="Prénom *" class="input-field" placeholder="Ex: Jean" />

          <!-- Clube -->
          <VaInput v-model="club" clearable label="Club *" class="input-field" placeholder="Ex: Paris Judo" />

          <!-- Sexe/genre -->
          <VaSelect
            v-model="sexe"
            clearable
            label="Sexe *"
            :options="sexes"
            class="input-field"
            placeholder="Sélectionnez un sexe"
          />

          <!-- grade -->
          <VaSelect
            v-model="grade"
            clearable
            label="Grade *"
            :options="grades"
            class="input-field"
            placeholder="Sélectionnez un grade"
          />

          <!-- Poids -->
          <VaInput v-model="poids" clearable label="Poids * (kg)" type="number" class="input-field" placeholder="Ex: 70" />

          <!-- date de naissance -->
          <VaInput v-model="dateNaissance" label="Date de naissance *" type="date" class="input-field wide" />
        </div>
      </VaCardContent>

      <VaCardActions align="right" class="modal-actions">
        <VaButton color="secondary" outline @click="close">Annuler</VaButton>
        <VaButton color="primary" :disabled="!isFormValid" @click="saveParticipant">
          {{ isEditMode ? "Modifier" : "Ajouter" }}
        </VaButton>
      </VaCardActions>
    </div>
  </VaModal>
</template>

<script setup>
import { ref, computed, defineEmits, onMounted } from "vue";
import { getAllGrades } from "@/store/tournoiStore";

const isOpen = ref(false);
const isEditMode = ref(false);
const editingParticipantId = ref(null);

const nom = ref("");
const prenom = ref("");
const club = ref("");
const sexe = ref(null);
const grade = ref(null);
const poids = ref(null);
const dateNaissance = ref("");

const grades = ref([]);
const sexes = ref([
  { text: "Homme", value: "Homme" },
  { text: "Femme", value: "Femme" },
]);

const emit = defineEmits(["save"]);

// charge les grades au montage
const loadData = async () => {
  const gradesRaw = await getAllGrades();
  grades.value = gradesRaw.map((g) => ({ text: g.label || g.nom, value: g.value || g.id }));
};
onMounted(loadData);

// verif du formulaire
const isFormValid = computed(() => 
  nom.value &&
  prenom.value &&
  club.value &&
  sexe.value &&
  grade.value &&
  poids.value &&
  dateNaissance.value
);

// save du participant
const saveParticipant = () => {
  const newParticipant = {
    id: editingParticipantId.value || Date.now(),
    nom: nom.value,
    prenom: prenom.value,
    club: club.value,
    sexe: sexe.value,
    grade: grade.value ? { text: grade.value.text, value: grade.value.value } : null,
    poids: poids.value,
    dateNaissance: dateNaissance.value,
  };

  const cleanParticipant = JSON.parse(JSON.stringify(newParticipant));
  emit("save", cleanParticipant);
  close();
};

// ouvre en mode édition
const openEdit = (participant) => {
  isEditMode.value = true;
  editingParticipantId.value = participant.id;
  nom.value = participant.nom;
  prenom.value = participant.prenom;
  club.value = participant.club;
  sexe.value = participant.sexe;
  grade.value = grades.value.find((g) => g.value === participant.grade?.value) || null;
  poids.value = participant.poids;
  dateNaissance.value = participant.dateNaissance;
  isOpen.value = true;
};

// ferme la modale et reinit les champs
const close = () => {
  isOpen.value = false;
  resetFields();
};

const resetFields = () => {
  nom.value = "";
  prenom.value = "";
  club.value = "";
  sexe.value = null;
  grade.value = null;
  poids.value = null;
  dateNaissance.value = "";
};

// ouvrir la modale en mode création ou édition
defineExpose({
  open: () => {
    resetFields();
    isEditMode.value = false;
    isOpen.value = true;
  },
  openEdit,
});
</script>

<style scoped>
/* modale */
.modal {
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

/* Carte */
.modal-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* Ggrille des champs */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* champs larges */
.input-field.wide {
  grid-column: span 2;
}

/* boutons */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
}
</style>
