<template>
  <VaModal v-model="isModalOpen" no-padding>
    <template #content>
      <div class="modal-container">
        <h2 class="modal-title">
          {{ isEditMode ? 'Modifier un participant' : 'Créer un participant' }}
        </h2>

        <VaForm ref="formRef">
          <div class="form-container">
            <div class="form-row">
              <div class="form-item">
                <VaInput v-model="form.firstName" label="Prénom *" clearable placeholder="Entrez le prénom"
                  :error-messages="errors.firstName"
                  @input="form.firstName = form.firstName.slice(0, 50); validateForm()" :max-length="50" counter />
              </div>
              <div class="form-item">
                <VaInput v-model="form.lastName" label="Nom *" clearable placeholder="Entrez le nom"
                  :error-messages="errors.lastName" @input="form.lastName = form.lastName.slice(0, 50); validateForm()"
                  :max-length="50" counter />
              </div>
            </div>

            <div class="form-row">
              <div class="form-item">
                <VaDateInput v-model="form.birthDate" label="Date de naissance *" clearable :aria-hidden="false"
                  :error-messages="errors.birthDate" @update:modelValue="validateForm" />
              </div>
              <div class="form-item">
                <VaInput v-model="form.weight" label="Poids" type="number" clearable placeholder="Entrez le poids"
                  :error-messages="errors.weight" @input="validateForm">
                  <template #appendInner>
                    <span>kg</span>
                  </template>
                </VaInput>
              </div>
            </div>

            <div class="form-row">
              <div class="form-item">
                <VaSelect v-model="form.nationalityId" label="Nationalité *" :options="nationalityOptions" clearable
                  placeholder="Choisissez une nationalité" searchable text-by="text" value-by="value"
                  searchPlaceholderText="Rechercher..">
                  <template #option="{ option, selectOption }">
                    <div class="select-option option-container"
                      :class="{ 'va-select-option--selected': Number(form.nationalityId) === Number(option.value) }"
                      @click="selectOption(option)">
                      <img class="flag" :src="getFlagUrl(option.flag)" alt="flag" />
                      <span class="country-name">{{ option.text }}</span>
                    </div>
                  </template>
                </VaSelect>
              </div>
              <div class="form-item">
                <VaInput v-model="form.clubName" label="Nom du club *" clearable placeholder="Entrez le nom du club"
                  :error-messages="errors.clubName" @input="form.clubName = form.clubName.slice(0, 30); validateForm()"
                  :max-length="30" counter />
              </div>
            </div>

            <div class="form-row">
              <div class="form-item">
                <VaSelect v-model="form.genderId" :options="genderOptions" label="Genre *" clearable
                  :error-messages="errors.genderId" @update:modelValue="validateForm">
                  <template #option="{ option, selectOption }">
                    <div class="select-option"
                      :class="{ 'va-select-option--selected': Number(form.genderId?.value) === Number(option.value) }"
                      @click="selectOption(option)">
                      <VaIcon
                        :name="option.value === 1 ? 'male' : option.value === 2 ? 'female' : 'help-circle-outline'"
                        class="gender-icon" />
                      {{ option.text }}
                    </div>
                  </template>
                </VaSelect>
              </div>
              <div class="form-item">
                <VaSelect v-model="form.gradeId" :options="gradeOptions" label="Grade *" clearable searchable
                  :error-messages="errors.gradeId" searchPlaceholderText="Rechercher.."
                  @update:modelValue="validateForm">
                  <template #option="{ option, selectOption }">
                    <div class="select-option"
                      :class="{ 'va-select-option--selected': Number(form.gradeId?.value) === Number(option.value) }"
                      @click="selectOption(option)">
                      {{ option.text }}
                    </div>
                  </template>
                </VaSelect>
              </div>
            </div>
          </div>
        </VaForm>

        <div class="modal-actions">
          <VaButton @click="closeModal" color="danger">
            Fermer
          </VaButton>
          <VaButton @click="showConfirmation = true" color="primary" :disabled="!isFormValid">
            {{ isEditMode ? 'Enregistrer' : 'Créer' }}
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>

  <!-- modale de confirmation -->
  <VaModal v-model="showConfirmation" size="small" hide-default-actions>
    <template #content>
      <div class="confirmation-container">
        <p class="modal-text">
          Êtes-vous sûr de vouloir {{ isEditMode ? 'modifier' : 'créer' }} ce participant ?
        </p>
        <div class="modal-actions">
          <VaButton color="secondary" @click="showConfirmation = false">
            Annuler
          </VaButton>
          <VaButton color="primary" @click="confirmSubmission">
            {{ isEditMode ? 'Modifier' : 'Créer' }}
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { genders, grades, nationality } from "../replicache/models/constants";

// props pr gerer ouverture modale et les donnees du participant
const props = defineProps({
  modelValue: Boolean, // controle ouverture modale
  participant: Object, // donnees participant null si mode crea
});

const emit = defineEmits(["update:modelValue", "save"]);

// calcule ouverture modale selon modelValue
const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// ferme la modale et reset confirmation
const closeModal = () => {
  emit("update:modelValue", false);
  showConfirmation.value = false;
};

// definir la liste des pays prioritaires en anglais (en minuscule pour la comparaison)
const priorityCountriesLower = ["france", "belgium", "germany", "luxembourg", "switzerland", "italy", "england", "spain", "portugal"];

const nationalityOptions = computed(() => {
  // on prend tous les pays
  const allCountries = nationality;

  // separer en trois groupes : priority, european et others
  const priority = [];
  const european = [];
  const others = [];

  allCountries.forEach(country => {
    const nameLower = country.name.toLowerCase();
    if (priorityCountriesLower.includes(nameLower)) {
      priority.push(country);
    } else if (country.currency && country.currency.code === "EUR") {
      european.push(country);
    } else {
      others.push(country);
    }
  });

  // trier les pays prioritaires selon l'ordre definit
  priority.sort((a, b) => priorityCountriesLower.indexOf(a.name.toLowerCase()) - priorityCountriesLower.indexOf(b.name.toLowerCase()));

  // trier les pays europeens et les autres par ordre alphabetique
  european.sort((a, b) => a.name.localeCompare(b.name));
  others.sort((a, b) => a.name.localeCompare(b.name));

  const sortedCountries = [...priority, ...european, ...others];

  // mapper pour creer les options en utilisant "text" pour le nom
  return sortedCountries.map(country => ({
    text: country.name, // nom en anglais
    flag: country.flag, // chaine base64 du drapeau
    value: country.id,
  }));
});

// fonction pour preparer l'url du drapeau
const getFlagUrl = (flagBase64) => {
  if (!flagBase64) return '';
  return `data:image/png;base64,${flagBase64}`;
};

// init form pr stocker infos participant
const form = ref({
  id: "",
  firstName: "",
  lastName: "",
  weight: "",
  nationalityId: "",
  clubName: "",
  genderId: null,
  gradeId: null,
  birthDate: null,
});

// erreurs validation form
const errors = ref({
  firstName: "",
  lastName: "",
  birthDate: "",
  weight: "",
  nationalityId: "",
  clubName: "",
  genderId: "",
  gradeId: "",
});

const isFormValid = ref(false);
const showConfirmation = ref(false);

// verifie si mode edit ou crea selon participant
const isEditMode = computed(() => {
  return props.participant && (props.participant.id || props.participant.source?.id);
});

// genere options pr select genre
const genderOptions = computed(() =>
  genders
    .filter((g) => g.nom !== "Mixte")
    .map((g) => ({ text: g.nom, value: Number(g.id) }))
);

// genere options pr select grade
const gradeOptions = computed(() =>
  grades.map((g) => ({ text: g.nom, value: Number(g.id) }))
);

// maj auto form selon participant recu
watch(
  () => props.participant,
  (participant) => {

    if (participant) {

      // cherche option correspondante pr genre
      const selectedGender = genderOptions.value.find(
        (g) => g.value === Number(participant.source?.genderId)
      );

      // cherche option correspondante pr grade
      const selectedGrade = gradeOptions.value.find(
        (g) => g.value === Number(participant.source?.gradeId)
      );

      // remplit form avec valeurs existantes ou vides
      form.value = {
        id: participant.source?.id || "",
        firstName: participant.source?.firstName || "",
        lastName: participant.source?.lastName || "",
        weight: participant.source?.weight ? Number(participant.source.weight) : null,
        nationalityId: participant.source?.nationalityId ? Number(participant.source.nationalityId) : "",
        clubName: participant.source?.clubName || "",
        genderId: selectedGender || null,
        gradeId: selectedGrade || null,
        birthDate: participant.source?.birthDate
          ? new Date(participant.source.birthDate)
          : null,
      };

    } else {
      form.value = {
        id: "",
        firstName: "",
        lastName: "",
        weight: null,
        nationalityId: "",
        clubName: "",
        genderId: null,
        gradeId: null,
        birthDate: null,
      };
    }
  },
  { immediate: true }
);

// verifie si form est valide
const validateForm = () => {
  errors.value = {
    firstName: form.value.firstName ? "" : "nom requis",
    lastName: form.value.lastName ? "" : "prenom requis",
    birthDate: form.value.birthDate ? "" : "date naissance requise",
    weight: form.value.weight !== null && form.value.weight < 0 ? "le poids doit être positif" : "",
    nationalityId: form.value.nationalityId ? "" : "nationalite requise",
    clubName: form.value.clubName ? "" : "nom club requis",
    genderId: form.value.genderId ? "" : "genre requis",
    gradeId: form.value.gradeId ? "" : "grade requis",
  };

  isFormValid.value = Object.values(errors.value).every((error) => error === "");
};

// surveille form et valide auto chaque modif
watch(form, validateForm, { deep: true, immediate: true });

// soumet form apres confirmation
const confirmSubmission = () => {
  emit("save", form.value);
  showConfirmation.value = false;
};
</script>



<style scoped>
.modal-container {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.modal-title {
  text-align: center;
  font-weight: bold;
  color: var(--va-text-primary);
  margin-bottom: 20px;
}

.form-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-item {
  flex: 1;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  width: 100%;
  max-width: 600px;
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.va-select-option--selected {
    background-color: #f9f9f9 !important; 
    font-weight: bold !important; 
    border-left: 5px solid #0c2432;
}

.select-option {
    padding: 8px;
    cursor: pointer;
}

.select-option:hover {
    background-color: #f4f4f4;
}

.confirmation-container {
  padding: 20px;
  text-align: center;
}

.modal-text {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
}

.option-container {
  display: flex;
  align-items: center;
  padding: 6 8px;
}

.option-container:hover {
  background-color: whitesmoke;
}

.flag {
  width: 20px;
  height: auto;
  margin-right: 8px;
}

.country-name {
  font-size: 0.9rem;
  color: #333;
}

</style>