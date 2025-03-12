<template>
    <VaModal v-model="isModalOpen" max-width="90vw" no-padding>

        <template #content>
            <div class="modal-container">
                <h2 class="modal-title">
                    {{ isEditMode ? 'Modifier une catégorie' : 'Créer une catégorie' }}
                </h2>

                <VaForm ref="formRef">
                    <div class="form-wrapper">

                        <!-- infos de la catégorie à gauche -->
                        <div class="select-section">
                            <div class="form-item">
                                <VaInput v-model="form.name" label="Nom de la catégorie *" placeholder="Entrez le nom"
                                    clearable counter :max-length="30" :error-messages="errors.name" :rules="[
                                        v => (v && v.length <= 30) || 'Maximum 30 caractères',
                                        v => {
                                            const duplicate = props.categories.find(cat =>
                                                cat.name.trim().toLowerCase() === v.trim().toLowerCase() &&
                                                cat.id !== (props.category?.source?.id || '')
                                            );
                                            return !duplicate || 'Ce nom de catégorie existe déjà.';
                                        }
                                    ]" @input="form.name = form.name.slice(0, 30); validateForm()" />

                            </div>
                            <div class="form-item">
                                <VaSelect v-model="form.genreId" :options="genderOptions" label="Genre *" clearable
                                    :error-messages="errors.genreId" @update:modelValue="validateForm" />
                            </div>
                            <div class="form-item">
                                <VaSelect v-model="form.typeId" :options="typeOptions" label="Type de catégorie"
                                    clearable :error-messages="errors.typeId" @update:modelValue="validateForm" />
                            </div>
                            <div class="form-item">
                                <VaSelect v-model="form.ageCategoryIds" :options="ageCategoryOptions" value-by="value"
                                    label="Type d'âge *" multiple clearable :error-messages="errors.ageCategoryIds"
                                    @update:modelValue="validateForm" :max-visible-options="2">
                                    <template #option="{ option, selectOption }">
                                        <div class="option-container" @click="selectOption(option)">
                                            <span class="option-text">{{ option.text }}</span>
                                            <div class="age-range">
                                                {{ getAgeRange(option.value) }}
                                            </div>
                                        </div>
                                    </template>
                                </VaSelect>
                            </div>
                            <div class="form-item">
                                <VaSelect v-model="form.minGradeId" :options="gradeOptions" label="Grade minimum *"
                                    clearable :error-messages="errors.minGradeId"
                                    @update:modelValue="updateMaxGradeOptions" />
                            </div>
                            <div class="form-item">
                                <VaSelect v-model="form.maxGradeId" :options="filteredMaxGradeOptions"
                                    label="Grade maximum *" clearable :error-messages="errors.maxGradeId"
                                    :disabled="!form.minGradeId" @update:modelValue="validateForm" />
                            </div>
                        </div>

                        <!-- participants à droite -->
                        <div class="participants-list">
                            <h3>Participants disponibles</h3>
                            <div class="filter-container">
                                <VaInput v-model="filter" placeholder="Rechercher..." class="filter-input" clearable />
                                <VaSelect v-model="filterByFields" placeholder="Champs" :options="columnsWithName"
                                    value-by="value" multiple class="filter-select" :max-visible-options="4"
                                    clearable />
                                <VaCheckbox v-model="filterByCriteria"
                                    label="Afficher uniquement les participants correspondant à 100% des critères" />
                            </div>
                            <VaDataTable :items="filteredParticipants" :columns="participantColumns" :filter="filter"
                                :filter-method="customFilteringFn" v-model:sort-by="sortBy" :allow-select-all="false"
                                v-model:sorting-order="sortingOrder" selectable select-mode="multiple"
                                :stickyHeader=true v-model="selectedParticipants" items-track-by="id"
                                :row-bind="getRowBind" :selectable="isRowSelectable" @row:click="toggleSelection"
                                no-data-html="Aucun participant trouvé" virtual-scroller>

                                <template #cell(status)="{ row }">
                                    <VaChip :color="getStatusColor(row)" size="small">
                                        {{ getStatusText(row) }}
                                    </VaChip>
                                </template>

                                <template #cell(gender)="{ row }">
                                    <span :class="getCellClass('gender', row)" :title="getCellTitle('gender', row)">
                                        {{ row.source.gender }}
                                    </span>
                                </template>

                                <template #cell(birthDate)="{ row }">
                                    <span :class="getCellClass('birthDate', row)"
                                        :title="getCellTitle('birthDate', row)">
                                        {{ row.source.birthDate }}
                                    </span>
                                </template>

                                <template #cell(grade)="{ row }">
                                    <span :class="getCellClass('grade', row)" :title="getCellTitle('grade', row)">
                                        {{ row.source.grade }}
                                    </span>
                                </template>

                                <template #cell(nationalityId)="{ row }">
                                    <div class="nationality-cell">
                                        <img v-if="getCountry(row.source?.nationalityId)"
                                            :src="getFlagUrl(getCountry(row.source?.nationalityId).flag)" alt="flag"
                                            class="nationality-flag" />
                                        <span>
                                            {{ getCountry(row.source?.nationalityId)?.name || row.source?.nationalityId
                                            }}
                                        </span>
                                    </div>
                                </template>
                            </VaDataTable>
                            <div class="participants-summary">
                                <VaChip color="info">{{ totalParticipants }} participant(s) totaux</VaChip>
                                <VaChip color="info">{{ filteredParticipants.length }} participant(s) affichés</VaChip>
                                <VaChip color="primary">{{ selectedParticipantsCount }} participant(s) selectionnés
                                </VaChip>
                                <VaChip color="success">{{ freeParticipantsCount }} participant(s) libres restants
                                </VaChip>
                            </div>
                        </div>
                    </div>
                </VaForm>


                <!-- actions -->
                <div class="modal-actions">
                    <VaButton @click="closeModal" color="danger"> Fermer </VaButton>
                    <div v-if="currentType && ((selectedParticipantsCount < currentType.minParticipants) || (selectedParticipantsCount > currentType.maxParticipants))"
                        color="warning" class="error-message">
                        La catégorie est de type {{ currentType.nom }}. Il y a {{ selectedParticipantsCount }}
                        participants selectionnés. Le nombre de participants selectionnés doit être entre {{
                        currentType.minParticipants }} et {{ currentType.maxParticipants }}.
                    </div>
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
                    Êtes-vous sûr de vouloir {{ isEditMode ? 'modifier' : 'créer' }} cette catégorie ?
                </p>
                <div class="modal-actions">
                    <VaButton color="secondary" @click="showConfirmation = false"> Annuler </VaButton>
                    <VaButton color="primary" @click="confirmSubmission"> {{ isEditMode ? 'Modifier' : 'Créer' }}
                    </VaButton>
                </div>
            </div>
        </template>
    </VaModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { VaModal, VaForm, VaInput, VaSelect, VaButton, VaDataTable, VaChip, VaAlert } from "vuestic-ui";
import { genders, grades, categoriesAge, categoriesTypes, nationality } from "../replicache/models/constants";

// props et emits
const props = defineProps({
    modelValue: Boolean,
    category: Object,
    categories: Array,
    participants: Array,
});

const emit = defineEmits(["update:modelValue", "save"]);

// reocuperer le nom du pays avec l'id
const getCountry = (natId) => {
  return nationality.find(country => country.id === Number(natId));
};

// recuperer l image en base 64
const getFlagUrl = (flagBase64) => {
  return flagBase64 ? `data:image/png;base64,${flagBase64}` : '';
};

// recuperer le echelle d'age entre le age min et max des categories d'age
const getAgeRange = (ageCategoryId) => {
  const category = categoriesAge.find(cat => Number(cat.id) === Number(ageCategoryId));
  if (category) {
    return `${category.ageMin} - ${category.ageMax} ans`;
  }
  return "";
};

const filterByCriteria = ref(false);

// etat de la modale
const isModalOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const currentType = computed(() => {
  if (!form.value.typeId) return null;
  const typeId = form.value.typeId.value || form.value.typeId;
  return categoriesTypes.find(t => Number(t.id) === Number(typeId));
});


// verif le nb de participants  selectionée en fonction du type de catégorie
const validateParticipantsCount = () => {
  if (form.value.typeId) {
    const selectedType = categoriesTypes.find(t => Number(t.id) === Number(form.value.typeId.value));
    if (selectedType) {
      const minParticipants = selectedType.minParticipants;
      const maxParticipants = selectedType.maxParticipants;
      const selectedCount = selectedParticipants.value.length;

      if (selectedCount < minParticipants || selectedCount > maxParticipants) {
        errors.value.typeId = `Le nombre de participants doit être entre ${minParticipants} et ${maxParticipants}.`;
        return false;
      } else {
        errors.value.typeId = "";
        return true;
      }
    }
  }
  return true;
};

// avoir le style css de la cellule en fonction de si le partiicpant correspond au critere de la category
const getCellClass = (columnKey, row) => {
    const participant = row.source;

    // verif le genre
    if (columnKey === "gender" && form.value.genreId && participant.genderId !== form.value.genreId.value && form.value.genreId.value !== 3) {
        return "non-matching-cell";
    }

    // verif l'âge
    if (columnKey === "birthDate" && form.value.ageCategoryIds.length > 0) {
        const age = calculateAge(participant.birthDate);
        const isAgeMatching = form.value.ageCategoryIds.some(ageCat => {
            const category = categoriesAge.find(cat => cat.id == ageCat);
            return category && age >= category.ageMin && age <= category.ageMax;
        });
        if (!isAgeMatching) {
            return "non-matching-cell";
        }
    }

    // verif le grade
    if (columnKey === "grade" && form.value.minGradeId && form.value.maxGradeId) {
        const participantGrade = participant.gradeId;
        if (participantGrade < form.value.minGradeId.value || participantGrade > form.value.maxGradeId.value) {
            return "non-matching-cell";
        }
    }

    return "";
};

const getCellTitle = (columnKey, row) => {
    const participant = row.source;

    // verif le genre
    if (columnKey === "gender" && form.value.genreId && participant.genderId !== form.value.genreId.value  && form.value.genreId.value !== 3) {
        return "Le genre du participant ne correspond pas à la catégorie.";
    }

    // verif l'âge
    if (columnKey === "birthDate" && form.value.ageCategoryIds.length > 0) {
        const age = calculateAge(participant.birthDate);
        const isAgeMatching = form.value.ageCategoryIds.some(ageCat => {
            const category = categoriesAge.find(cat => cat.id == ageCat);
            return category && age >= category.ageMin && age <= category.ageMax;
        });
        if (!isAgeMatching) {
            return `L'âge du participant (${age} ans) ne correspond pas aux catégories d'âge sélectionnées.`;
        }
    }

    // verif le grade
    if (columnKey === "grade" && form.value.minGradeId && form.value.maxGradeId) {
        const participantGrade = participant.gradeId;
        if (participantGrade < form.value.minGradeId.value || participantGrade > form.value.maxGradeId.value) {
            return "Le grade du participant ne correspond pas à la plage de grades sélectionnée.";
        }
    }

    return "";
};

// formulaire
const form = ref({
    id: "",
    name: "",
    genreId: null,
    typeId: null,
    ageCategoryIds: [],
    minGradeId: null,
    maxGradeId: null,
});

// erreurs de validation
const errors = ref({
    name: "",
    genreId: "",
    typeId: "",
    ageCategoryIds: "",
    minGradeId: "",
    maxGradeId: "",
});

// validation du formulaire
const isFormValid = ref(false);
const showConfirmation = ref(false);

// mode edition
const isEditMode = computed(() => {
    return props.category && (props.category.id || props.category.source?.id);
});

const totalParticipants = computed(() =>
  props.participants.filter(p =>
    p.categoryId === -1 || p.categoryId === props?.category?.source?.id
  ).length
);

const selectedParticipantsCount = computed(() => selectedParticipants.value.length);
const freeParticipantsCount = computed(() => totalParticipants.value - selectedParticipantsCount.value);


// filtres et tri
const filter = ref(""); // stocke la valeur du filtre appliqué sur les participants
const filterByFields = ref([]); // liste des champs sur lesquels le filtre doit être appliqué
const sortBy = ref("firstName"); // champ par lequel trier les participants
const sortingOrder = ref("asc"); // ordre de tri : ascendant ou descendant

const toggleSelection = (row) => {
  if (!isRowSelectable(row.item)) return; // ne rien faire si la ligne est désactivée

  const index = selectedParticipants.value.findIndex(p => p === row.item.id);
  if (index === -1) {
    selectedParticipants.value.push(row.item.id); // sélectionner la ligne
  } else {
    selectedParticipants.value.splice(index, 1); // désélectionner la ligne
  }
};


const columnsWithName = [
    { value: "firstName", text: "Prenom"  },
    { value: "lastName", text: "Nom" },
    { value: "birthDate", text: "Date de naissance" },
    { value: "gender", text: "Genre" },
    { value: "grade", text: "Grade" },
    { value: "clubName", text: "Club" },
    { value: "weight", text: "Poids" },
    { value: "nationalityId", text: "Nationalite" },
];

const customFilteringFn = (source, cellData) => {
    if (!filter.value) return true;

    if (filterByFields.value.length >= 1) {
        const searchInCurrentRow = filterByFields.value.some(
            (field) => cellData.column.key === field
        );
        if (!searchInCurrentRow) return false;
    }

    const filterRegex = new RegExp(filter.value, "i");
    return filterRegex.test(source);
};

// participants selectionnes
const selectedParticipants = ref([]); // liste des participants sélectionnés par l'utilisateur

// participants filtres
const filteredParticipants = computed(() => {
  let participants = props.participants.filter(p => p.categoryId === -1 || p.categoryId === props?.category?.source?.id); // uniquement les participants libres

  if (filterByCriteria.value) {
    participants = participants.filter(p => {
      // verif de l'âge
      const isAgeMatching = form.value.ageCategoryIds.length === 0 || form.value.ageCategoryIds.some(ageCat => {
        const category = categoriesAge.find(cat => cat.id == ageCat);
        const age = calculateAge(p.birthDate);
        return category && age >= category.ageMin && age <= category.ageMax;
      });

      // verif du genre
      const isGenderMatching = !form.value.genreId || p.genderId === form.value.genreId.value || form.value.genreId.value === 3;

      // verif du grade
      const isGradeMatching = !form.value.minGradeId || !form.value.maxGradeId ||
        (p.gradeId >= form.value.minGradeId.value && p.gradeId <= form.value.maxGradeId.value);

      return isAgeMatching && isGenderMatching && isGradeMatching;
    });
  }

  return participants.map((p) => ({
    ...p,
    status: getStatusText(p), 
  }));
});

// gestion des statuts mis a jour dynamiquement
const getStatusText = (participant) => {
    if (selectedParticipants.value.includes(participant.source?.id)) {
        return "Selectionné"; // participant sélectionné par l'utilisateur
    }
    else if (!selectedParticipants.value.includes(participant.source?.id) && participant.source?.categoryId === props.category?.source?.id) {
        return "Libre"; // participant désélectionné mais initialement dans la catégorie
    }
    else if (participant.source?.categoryId !== -1) {
        return "Non disponible"; // participant déjà attribué à une autre catégorie
    }
    else {
        return "Libre"; // participant libre et disponible pour sélection
    }
};

const getStatusColor = (participant) => {
    if (selectedParticipants.value.includes(participant.source?.id)) {
        return "primary"; // bleu : participant sélectionné
    }
    else if (!selectedParticipants.value.includes(participant.source?.id) && participant.source?.categoryId === props.category?.source?.id) {
        return "success"; // vert : participant redevenu libre après désélection
    }
    else if (participant.source?.categoryId !== -1) {
        return "danger"; // rouge : participant non disponible
    }
    else {
        return "success"; // vert : participant libre
    }
};

// desactiver les lignes pour les participants deja attribues a d'autres categories
const getRowBind = (row) => {
    if (row.categoryId !== -1 && row.categoryId !== props.category?.source?.id) {
        return {
            class: ["disabled-row"],
            style: { pointerEvents: "none", opacity: 0.6 },
        };
    }
    return {};
};

// options des selecteurs
const genderOptions = computed(() =>
    genders.map((g) => ({ text: g.nom, value: Number(g.id) }))
);

const typeOptions = computed(() =>
  categoriesTypes.map((t) => ({
    text: `${t.nom} (${t.minParticipants} à ${t.maxParticipants} participants)`,
    value: Number(t.id),
  }))
);

const ageCategoryOptions = computed(() =>
    categoriesAge.map((a) => ({ text: a.nom, value: Number(a.id) }))
);

const gradeOptions = computed(() =>
    grades.map((g) => ({ text: g.nom, value: Number(g.id) }))
);

// filtrage des grades maximum
const filteredMaxGradeOptions = computed(() => {
    if (!form.value.minGradeId) return gradeOptions.value;
    return gradeOptions.value.filter((g) => g.value >= form.value.minGradeId.value);
});

// mise a jour des grades maximum
const updateMaxGradeOptions = () => {
    if (!form.value.minGradeId) {
        form.value.maxGradeId = null;
    }

    else if (form.value.maxGradeId && form.value.maxGradeId?.value < form.value.minGradeId?.value) {
        form.value.maxGradeId = null; // réinitialise maxGradeId si minGradeId devient plus grand
    }
};

watch(() => form.value.minGradeId, updateMaxGradeOptions);

// watch sur la categorie
watch(
    () => props.category,
    (category) => {
        if (category?.source) {

            selectedParticipants.value = props.participants
                .filter(p => p.categoryId === props.category.source.id) // filtrer les participants appartenant à la catégorie
                .map(p => p.id); // extraire leurs IDs sous forme de string

            // init du formulaire
            const selectedGender = genderOptions.value.find(
                (g) => g.value === Number(category.source.genreId)
            );

            const selectedType = typeOptions.value.find(
                (t) => t.value === Number(category.source.typeId)
            );

            const selectedAgeCategories = category.source.ageCategoryIds
                ? category.source.ageCategoryIds.map(id =>
                    ageCategoryOptions.value.find((a) => a.value === Number(id))
                ).filter(Boolean)
                : [];

            const selectedMinGrade = gradeOptions.value.find(
                (g) => g.value === Number(category.source.minGradeId)
            );

            const selectedMaxGrade = gradeOptions.value.find(
                (g) => g.value === Number(category.source.maxGradeId)
            );

            form.value = {
                id: category.source.id || "",
                name: category.source.name || "",
                genreId: selectedGender || null,
                typeId: selectedType || null,
                ageCategoryIds: selectedAgeCategories || [],
                minGradeId: selectedMinGrade || null,
                maxGradeId: selectedMaxGrade || null,
            };
        } else {
            form.value = {
                id: "",
                name: "",
                genreId: null,
                typeId: null,
                ageCategoryIds: [],
                minGradeId: null,
                maxGradeId: null,
            };
        }
    },
    { immediate: true }
);

// calcul l'age d'un participant avec sa date de naissance
const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// validation du formulaire
const validateForm = () => {
    errors.value = {
        name: form.value.name ? "" : "Nom requis",
        genreId: form.value.genreId ? "" : "Genre requis",
        ageCategoryIds: Array.isArray(form.value.ageCategoryIds) && form.value.ageCategoryIds.length
            ? ""
            : "Type d'âge requis",
        minGradeId: form.value.minGradeId ? "" : "Grade minimum requis",
        maxGradeId: form.value.maxGradeId ? "" : "Grade maximum requis",
    };

    // verif si une autre catégorie (hors la catégorie actuelle) a déjà ce nom
    if (form.value.name) {
        const duplicate = props.categories.find(cat =>
            cat.name.trim().toLowerCase() === form.value.name.trim().toLowerCase() &&
            cat.id !== props.category?.source?.id
        );
        if (duplicate) {
            errors.value.name = "Ce nom de catégorie existe déjà.";
        }
    }

    validateParticipantsCount();

    isFormValid.value = Object.values(errors.value).every((error) => error === "");
};


watch(form, validateForm, { deep: true, immediate: true });
watch(selectedParticipants, validateForm, { deep: true });

const confirmSubmission = () => {
    const selectedIds = selectedParticipants.value; // IDs des participants sélectionnés

    // récup les IDs des participants qui étaient sélectionnés de base
    const initialSelectedIds = props.participants
        .filter(p => p.categoryId === props.category?.source?.id)
        .map(p => p.id);

    // déterminer ceux à attacher (nouveaux sélectionnés)
    const toAttach = selectedIds.filter(id => !initialSelectedIds.includes(id));

    // déterminer ceux à détacher (désélectionnés)
    const toUnlink = initialSelectedIds.filter(id => !selectedIds.includes(id));

    // ajouter une action pour chaque participant
    const participantsWithAction = [
        ...toAttach.map(id => ({ id, action: 'attachToCategory' })),
        ...toUnlink.map(id => ({ id, action: 'unlinkFromCategory' }))
    ];

    // émettre l'événement avec la catégorie et les participants mis à jour
    emit("save", { category: form.value, participants: participantsWithAction });

    showConfirmation.value = false;
};

const isRowSelectable = (row) => {
  return !(row.categoryId !== -1 && row.categoryId !== props.category?.source?.id);
};

// fermeture de la modale
const closeModal = () => {
    emit("update:modelValue", false);
    showConfirmation.value = false;
};

// colonnes de la table
const participantColumns = [
    { key: "status", label: "Statut", sortable: true},
    { key: "firstName", label: "Prenom", sortable: true},
    { key: "lastName", label: "Nom", sortable: true},
    { key: "birthDate", label: "Date de naissance" },
    { key: "gender", label: "Genre", sortable: true },
    { key: "grade", label: "Grade", sortable: true },
    { key: "clubName", label: "Club", sortable: true },
    { key: "weight", label: "Poids", sortable: true },
    { key: "nationalityId", label: "Nationalite", sortable: true },
];
</script>



<style scoped>
.modal-container {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: auto;
    width: 100%;
}

.modal-title {
    text-align: center;
    font-weight: bold;
    color: var(--va-text-primary);
    margin-bottom: 15px;
}

.non-matching-cell {
    color: red !important;
    font-weight: bold;
}

.error-message {
    color: red;
    font-weight: bold;
    padding-top: 8px;
}

.filter-container {
    display: flex;
    gap: 10px;
    margin-bottom: 4px;
    margin-top: 10px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.va-data-table__table-thead--sticky th.va-data-table__table-cell-select {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    width: 0 !important;
}

.va-virtual-scroller {
    height: 80% !important;
}

.option-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.3s ease;
}

.option-container:hover {
  background-color: #f9f9f9;
}

.option-container .option-text {
  font-size: 14px;
  color: #333;
}

.filter-container {
    display: flex;
    gap: 10px;
    margin-bottom: 4px;
    margin-top: 10px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.filter-container .va-checkbox {
    margin-left: auto;
}

.option-container .age-range {
    font-size: 13px;
    color: #777;
    font-style: italic;
}

.form-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.participants-summary {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 10px;
}

.flex.justify-between.items-center {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.nationality-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nationality-flag {
  width: 20px;
  height: auto;
  vertical-align: middle;
}

.form-item {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.va-input-wrapper,
.va-select {
    width: 100% !important;
    flex-grow: 1;
}

.form-wrapper {
    display: flex;
    width: 100%;
    gap: 20px;
}

.participants-list {
    flex-grow: 1;
    min-height: 300px;
    height: 500px !important;
}

.select-section {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.va-data-table {
    width: 100%;
}

.modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    width: 100%;
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
</style>