<template>
    <VaModal v-model="isModalOpen" class="custom-modal" max-width="90vw" no-padding>

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
                                <VaInput v-model="form.name" label="Nom de la catégorie *" clearable counter
                                    placeholder="Entrez le nom" :error-messages="errors.name" :max-length="30"
                                    @input="form.name = form.name.slice(0, 30); validateForm()" />
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
                                    @update:modelValue="validateForm" :max-visible-options="2" />
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
                            </div>
                            <VaDataTable :items="filteredParticipants" :columns="participantColumns" :filter="filter"
                                :filter-method="customFilteringFn" v-model:sort-by="sortBy" :allow-select-all="false"
                                v-model:sorting-order="sortingOrder" selectable select-mode="multiple"
                                :stickyHeader=true v-model="selectedParticipants" items-track-by="id"
                                :row-bind="getRowBind" :selectable="isRowSelectable"
                                no-data-html="Aucun participant trouvé" virtual-scroller>

                                <template #cell(status)="{ row }">
                                    <VaChip :color="getStatusColor(row)" size="small">
                                        {{ getStatusText(row) }}
                                    </VaChip>
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

// etat de la modale
const isModalOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

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

const totalParticipants = computed(() => props.participants.length);
const selectedParticipantsCount = computed(() => selectedParticipants.value.length);
const freeParticipantsCount = computed(() => totalParticipants.value - selectedParticipantsCount.value);

// filtres et tri
const filter = ref(""); // stocke la valeur du filtre appliqué sur les participants
const filterByFields = ref([]); // liste des champs sur lesquels le filtre doit être appliqué
const sortBy = ref("firstName"); // champ par lequel trier les participants
const sortingOrder = ref("asc"); // ordre de tri : ascendant ou descendant

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
    return props.participants.map((p) => ({
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
    categoriesTypes.map((t) => ({ text: t.nom, value: Number(t.id) }))
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

onMounted(() => { // permet de supprimer la checkbox pour tout sélectionner dans la datagrid car aucun autre moyen de la disable,
// et impossible de la régler pour ne pas sélectionner les participants déjà inclus à une autre catégorie !
    setTimeout(() => {
        const th = document.querySelector('.va-data-table__table-thead--sticky th.va-data-table__table-cell-select');
        if (th) {
            const checkboxContainer = th.querySelector('.va-message-list-wrapper.va-checkbox');
            if (checkboxContainer) {
                checkboxContainer.remove(); // supprime uniquement l'élément enfant contenant la checkbox
            } else {
            }
        }
    }, 100); // petit délai pour s'assurer que l'élément est bien chargé
});

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

    isFormValid.value = Object.values(errors.value).every((error) => error === "");
};

watch(form, validateForm, { deep: true, immediate: true });

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
    { key: "status", label: "Statut", sortable: true },
    { key: "firstName", label: "Prenom", sortable: true },
    { key: "lastName", label: "Nom", sortable: true },
    { key: "birthDate", label: "Date de naissance", sortable: true },
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