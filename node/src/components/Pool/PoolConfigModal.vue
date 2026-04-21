<template>
  <VaModal v-model="isOpen" size="large" hide-default-actions no-outside-dismiss no-esc-dismiss
    @update:model-value="val => !val && cancel()">
    <template #content>
      <div class="config-modal">

        <!-- en-tete -->
        <div class="config-header">
          <div class="config-title-row">
            <h2 class="config-title">⚙️ Configuration des poules</h2>
            <div class="stats-chips">
              <span class="stat-chip stat-chip--total">
                <span class="stat-chip-value">{{ allCategoryParticipants.length }}</span>
                <span class="stat-chip-label">total</span>
              </span>
              <span class="stat-chip stat-chip--ok">
                <span class="stat-chip-value">{{ assignedCount }}</span>
                <span class="stat-chip-label">assignés</span>
              </span>
              <span class="stat-chip" :class="unassigned.length > 0 ? 'stat-chip--warn' : 'stat-chip--ok'">
                <span class="stat-chip-value">{{ unassigned.length }}</span>
                <span class="stat-chip-label">non assignés</span>
              </span>
            </div>
          </div>

          <div class="toolbar">
            <div class="toolbar-group">
              <span class="toolbar-label">Nombre de poules :</span>
              <input
                v-model.number="targetNbPools"
                type="number"
                :min="1"
                :max="allCategoryParticipants.length"
                class="nb-pools-input"
              />
              <VaButton @click="autoGenerate" icon="auto_fix_high" color="primary" size="small" preset="outlined">
                Auto-générer
              </VaButton>
            </div>
            <div class="toolbar-group">
              <VaButton @click="showParticipantModal = true" icon="person_add" color="primary" size="small" preset="outlined">
                + Manuel
              </VaButton>
              <VaButton @click="csvInputRef.click()" icon="upload_file" color="primary" size="small" preset="outlined">
                + CSV
              </VaButton>
              <input ref="csvInputRef" type="file" accept=".csv" class="hidden-input" @change="importFromCSV" />
            </div>
          </div>
        </div>

        <!-- avertissement matchs existants -->
        <div v-if="hasExistingMatches" class="alert-banner alert-banner--warning">
          <span class="alert-icon">⚠️</span>
          <span>Des matchs ont déjà été joués dans cette configuration. Valider supprimera tous les résultats existants et régénérera les matchs.</span>
        </div>

        <!-- indication de sélection active -->
        <div v-if="selected" class="alert-banner alert-banner--info">
          <span class="alert-icon">👆</span>
          <span><strong>{{ selected.participant.lastName }} {{ selected.participant.firstName }}</strong> sélectionné — cliquez sur une poule pour le déplacer, ou recliquez pour annuler.</span>
        </div>

        <!-- grille des poules -->
        <div class="pools-grid">

          <!-- colonne Non assignes -->
          <div
            class="pool-col unassigned-col"
            :class="{ 'dropzone-active': selected && selected.fromPool !== -1 }"
            @click="selected && selected.fromPool !== -1 ? dropTo(-1) : null"
          >
            <div class="pool-col-header unassigned-header">
              <span class="col-title">Non assignes</span>
              <span class="col-count">{{ unassigned.length }}</span>
            </div>
            <div class="participants-list">
              <div
                v-for="p in unassigned"
                :key="p.id"
                class="participant-chip"
                :class="{ 'chip-selected': selected?.participant.id === p.id }"
                @click.stop="pickParticipant(p, -1)"
                :title="`${p.clubName || ''} | ${p.weight ? p.weight + ' kg' : ''}`"
              >
                <span class="chip-name">{{ p.lastName }} {{ p.firstName }}</span>
                <span class="chip-meta">{{ p.weight ? p.weight + 'kg' : '' }}</span>
                <button class="chip-btn chip-info" @click="openDetail(p, $event)" title="Détails">ℹ</button>
                <button class="chip-btn chip-remove" @click="askRemoveParticipant(p, -1, $event)" title="Retirer de la catégorie">×</button>
              </div>
              <div v-if="unassigned.length === 0" class="empty-label">
                Tous les participants sont assignes
              </div>
            </div>
          </div>

          <!-- colonnes des poules editables -->
          <div
            v-for="(pool, idx) in editablePools"
            :key="idx"
            class="pool-col"
            :class="{ 'dropzone-active': selected && selected.fromPool !== idx }"
            @click="selected && selected.fromPool !== idx ? dropTo(idx) : null"
          >
            <div class="pool-col-header">
              <span class="col-title">{{ pool.label }}</span>
              <span class="col-count">{{ pool.participants.length }}</span>
              <button
                class="remove-pool-btn"
                @click.stop="removePool(idx)"
                title="Supprimer cette poule (les participants reviennent dans Non assignes)"
              >x</button>
            </div>
            <div class="participants-list">
              <div
                v-for="p in pool.participants"
                :key="p.id"
                class="participant-chip"
                :class="{ 'chip-selected': selected?.participant.id === p.id }"
                @click.stop="pickParticipant(p, idx)"
                :title="`${p.clubName || ''} | ${p.weight ? p.weight + ' kg' : ''}`"
              >
                <span class="chip-name">{{ p.lastName }} {{ p.firstName }}</span>
                <span class="chip-meta">{{ p.weight ? p.weight + 'kg' : '' }}</span>
                <button class="chip-btn chip-info" @click="openDetail(p, $event)" title="Détails">ℹ</button>
                <button class="chip-btn chip-remove" @click="askRemoveParticipant(p, idx, $event)" title="Retirer de la catégorie">×</button>
              </div>
              <div v-if="pool.participants.length === 0" class="empty-label">
                Poule vide
              </div>
            </div>
          </div>

          <!-- bouton ajouter une poule -->
          <div class="add-pool-col">
            <button class="add-pool-btn" @click.stop="addPool">
              <span class="add-icon">+</span>
              <span>Ajouter<br/>une poule</span>
            </button>
          </div>

        </div>

        <!-- actions bas de modal -->
        <div class="config-footer">
          <VaButton color="secondary" preset="outlined" @click="cancel" :disabled="saving">Annuler</VaButton>
          <div class="footer-right">
            <span v-if="unassigned.length > 0" class="footer-hint">
              ⚠️ {{ unassigned.length }} participant(s) non assigné(s)
            </span>
            <VaButton
              color="success"
              @click="hasExistingMatches && !confirmingReset ? confirmingReset = true : validate()"
              :loading="saving"
              :disabled="unassigned.length > 0"
            >
              Valider la configuration
            </VaButton>
          </div>
        </div>

      </div>
    </template>
  </VaModal>

  <!-- modale confirmation réinitialisation -->
  <VaModal v-model="confirmingReset" size="small" hide-default-actions :no-outside-dismiss="true">
    <template #content>
      <div style="padding: 24px;">
        <div style="font-size: 2rem; text-align: center; margin-bottom: 12px;">⚠️</div>
        <h3 style="text-align: center; margin-bottom: 12px; color: #c92a2a;">Réinitialisation des résultats</h3>
        <p style="text-align: center; margin-bottom: 20px; color: #495057;">
          Des matchs ont déjà été joués dans cette configuration.<br/>
          Tous les résultats seront <strong>définitivement perdus</strong>.
        </p>
        <div style="display: flex; justify-content: center; gap: 12px;">
          <VaButton color="secondary" preset="outlined" @click="confirmingReset = false">Non, annuler</VaButton>
          <VaButton color="danger" :loading="saving" @click="validate">Oui, réinitialiser</VaButton>
        </div>
      </div>
    </template>
  </VaModal>

  <!-- modale confirmation suppression -->
  <VaModal v-model="showRemoveConfirm" size="small" hide-default-actions>
    <template #content>
      <div style="padding: 20px;">
        <p style="margin-bottom: 16px;">
          Retirer <strong>{{ participantToRemove?.participant.lastName }} {{ participantToRemove?.participant.firstName }}</strong> de la catégorie ?
        </p>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <VaButton color="secondary" @click="showRemoveConfirm = false">Annuler</VaButton>
          <VaButton color="danger" @click="confirmRemoveParticipant">Retirer</VaButton>
        </div>
      </div>
    </template>
  </VaModal>

  <!-- modale détails participant -->
  <VaModal v-model="showDetailModal" hide-default-actions size="large">
    <template #content>
      <ParticipantDetails
        v-if="detailParticipant"
        :participant="detailParticipant"
        :participants="allParticipantsLocal"
      />
      <div style="text-align:right; padding: 8px 20px;">
        <VaButton color="secondary" @click="showDetailModal = false">Fermer</VaButton>
      </div>
    </template>
  </VaModal>

  <!-- modale ajout manuel -->
  <ParticipantModal
    v-model="showParticipantModal"
    :participant="null"
    @save="handleCreateParticipant"
  />

  <!-- modale import CSV -->
  <ImportParticipantsModal
    v-model="showImportModal"
    :imported-participants="csvParticipants"
    :import-columns="importColumns"
    :get-country="getCountry"
    :get-grade-name="getGradeName"
    :registered-participants="allParticipantsLocal"
    @confirm-import="handleConfirmImport"
    @cancel-import="showImportModal = false"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, toRaw } from 'vue';
import { useToast } from 'vuestic-ui';
import { generatePools } from '@/functions/generatePools';
import { poolManagerService } from '@/replicache/services/Pool/poolManagerService';
import { getMatchesByPool } from '@/replicache/stores/matchStore';
import { getParticipantsByTournament } from '@/replicache/stores/participantStore';
import { ParticipantService } from '@/replicache/services/participantService';
import { nationality, grades } from '@/replicache/models/constants';
import ParticipantModal from '@/components/ParticipantModal.vue';
import ImportParticipantsModal from '@/components/ImportParticipantsModal.vue';
import ParticipantDetails from '@/components/ParticipantDetails.vue';

const { init: toast } = useToast();

const props = defineProps({
  modelValue:              { type: Boolean, required: true },
  poolManagerId:           { type: String, required: true },
  allPools:                { type: Array, required: true },
  allCategoryParticipants: { type: Array, required: true },
  category:                { type: Object, required: true },
  tournamentId:            { type: String, required: true },
});

const emit = defineEmits(['update:modelValue', 'saved', 'participants-changed']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// === ETAT LOCAL ===
const editablePools = ref([]);
const unassigned = ref([]);
const selected = ref(null);
const saving = ref(false);
const hasExistingMatches = ref(false);
const targetNbPools = ref(1);
const confirmingReset = ref(false);

// detail participant
const detailParticipant = ref(null);
const showDetailModal = ref(false);

// ajout manuel
const showParticipantModal = ref(false);

// import CSV
const showImportModal = ref(false);
const csvParticipants = ref([]);
const csvInputRef = ref(null);

// tous les participants du tournoi (pour détection doublons)
const allTournamentParticipants = ref([]);

const loadTournamentParticipants = async () => {
  allTournamentParticipants.value = await getParticipantsByTournament(props.tournamentId);
};

// liste locale complète (pour résoudre les noms dans ParticipantDetails)
const allParticipantsLocal = computed(() => [
  ...props.allCategoryParticipants,
  ...unassigned.value.filter(p => !props.allCategoryParticipants.some(x => x.id === p.id)),
]);

const importColumns = [
  { key: 'firstName', label: 'Prénom', sortable: true },
  { key: 'lastName', label: 'Nom', sortable: true },
  { key: 'birthDate', label: 'Date de naissance', sortable: true },
  { key: 'genderId', label: 'Genre', sortable: false },
  { key: 'gradeId', label: 'Grade', sortable: true },
  { key: 'clubName', label: 'Club', sortable: true },
  { key: 'weight', label: 'Poids', sortable: true },
  { key: 'nationalityId', label: 'Nationalité', sortable: true },
];

// doublon = déjà dans cette catégorie (pas dans tout le tournoi)
const isDuplicate = (p) =>
  allParticipantsLocal.value.some(r =>
    r.firstName?.trim().toLowerCase() === p.firstName?.trim().toLowerCase() &&
    r.lastName?.trim().toLowerCase() === p.lastName?.trim().toLowerCase() &&
    (r.birthDate || '') === (p.birthDate || '')
  );

// retrouve un participant existant dans le tournoi (pour réassigner sans recréer)
const findExistingInTournament = (p) =>
  allTournamentParticipants.value.find(r =>
    r.firstName?.trim().toLowerCase() === p.firstName?.trim().toLowerCase() &&
    r.lastName?.trim().toLowerCase() === p.lastName?.trim().toLowerCase() &&
    (r.birthDate || '') === (p.birthDate || '')
  );

const getCountry = (id) => nationality.find(c => c.id === Number(id)) || null;
const getGradeName = (id) => grades.find(g => g.id === String(id))?.nom || '';

// === COMPUTED ===
const assignedCount = computed(() =>
  editablePools.value.reduce((sum, p) => sum + p.participants.length, 0)
);

// === INITIALISATION ===
const initFromExistingPools = async () => {
  // separrer poules editables et poule finale
  const isMulti = props.allPools.length > 1;
  const editable = isMulti
    ? props.allPools.filter(p => p.label !== 'Poule Finale')
    : [...props.allPools];

  editablePools.value = editable.map(p => ({
    id: p.id,
    label: p.label,
    participants: [...(p.participants || [])],
  }));

  targetNbPools.value = editablePools.value.length || 1;

  // calculer les non assignes
  const assignedIds = new Set(
    editablePools.value.flatMap(p => p.participants.map(pt => pt.id))
  );
  unassigned.value = props.allCategoryParticipants.filter(p => !assignedIds.has(p.id));

  // verifier si des matchs ont deja ete commences (score, faute, temps écoulé ou terminé)
  let foundMatch = false;
  for (const pool of editable) {
    if (foundMatch) break;
    const matches = await getMatchesByPool(pool.id);
    if (matches.some(m =>
      m.idWinner !== null ||
      m.ipponsPlayer1 > 0 || m.ipponsPlayer2 > 0 ||
      m.keikokusPlayer1 > 0 || m.keikokusPlayer2 > 0 ||
      (m.timer && m.timer.currentTime < 180)
    )) {
      foundMatch = true;
    }
  }
  hasExistingMatches.value = foundMatch;
  confirmingReset.value = false;
};

onMounted(() => {
  initFromExistingPools();
  loadTournamentParticipants();
});

watch(() => props.allPools, initFromExistingPools, { deep: true });

// === SELECTION / DEPLACEMENT ===

const pickParticipant = (participant, fromPool) => {
  if (selected.value?.participant.id === participant.id) {
    selected.value = null;
    return;
  }
  selected.value = { participant, fromPool };
};

const dropTo = (toPool) => {
  if (!selected.value) return;
  const { participant, fromPool } = selected.value;

  // retirer de la source
  if (fromPool === -1) {
    unassigned.value = unassigned.value.filter(p => p.id !== participant.id);
  } else {
    editablePools.value[fromPool].participants =
      editablePools.value[fromPool].participants.filter(p => p.id !== participant.id);
  }

  // ajouter a la cible
  if (toPool === -1) {
    unassigned.value.push(participant);
  } else {
    editablePools.value[toPool].participants.push(participant);
  }

  selected.value = null;
};

// === GESTION DES POULES ===

const addPool = () => {
  const nextNum = editablePools.value.length + 1;
  editablePools.value.push({
    id: null,
    label: `Poule ${nextNum}`,
    participants: [],
  });
};

const removePool = (idx) => {
  const removed = editablePools.value.splice(idx, 1)[0];
  unassigned.value.push(...removed.participants);
  if (selected.value?.fromPool === idx) selected.value = null;
};

// === AUTO-GENERATION ===

const autoGenerate = () => {
  const nb = Math.max(1, Math.min(targetNbPools.value || 1, props.allCategoryParticipants.length));
  const generated = generatePools(props.allCategoryParticipants, nb);

  const labelToId = new Map(editablePools.value.map(p => [p.label, p.id]));
  editablePools.value = generated.structure
    .filter(p => p.label !== 'Poule Finale' || generated.structure.length === 1)
    .map(p => ({
      id: labelToId.get(p.label) || null,
      label: p.label,
      participants: p.participants,
    }));

  unassigned.value = [];
  selected.value = null;
};

// === VALIDATION ===

const validate = async () => {
  saving.value = true;
  try {
    const rawPools = toRaw(editablePools.value).map(pool => ({
      ...toRaw(pool),
      participants: toRaw(pool.participants).map(p => toRaw(p)),
    }));
    await poolManagerService.applyPoolConfiguration(
      props.poolManagerId,
      rawPools
    );
    emit('saved');
    isOpen.value = false;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la configuration des poules :', err);
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  if (saving.value) return;
  selected.value = null;
  isOpen.value = false;
};

// === DETAILS PARTICIPANT ===
const openDetail = (p, event) => {
  event.stopPropagation();
  detailParticipant.value = p;
  showDetailModal.value = true;
};

// === SUPPRESSION PARTICIPANT ===
const participantToRemove = ref(null);
const showRemoveConfirm = ref(false);

const askRemoveParticipant = (p, fromPool, event) => {
  event.stopPropagation();
  participantToRemove.value = { participant: p, fromPool };
  showRemoveConfirm.value = true;
};

const confirmRemoveParticipant = async () => {
  const { participant: p, fromPool } = participantToRemove.value;
  if (selected.value?.participant.id === p.id) selected.value = null;
  if (fromPool === -1) {
    unassigned.value = unassigned.value.filter(x => x.id !== p.id);
  } else {
    editablePools.value[fromPool].participants =
      editablePools.value[fromPool].participants.filter(x => x.id !== p.id);
  }
  await ParticipantService.updateParticipantCategory(p.id, -1);
  emit('participants-changed');
  showRemoveConfirm.value = false;
  participantToRemove.value = null;
};

// === AJOUT MANUEL ===
const handleCreateParticipant = async (formData) => {
  const formatted = {
    ...formData,
    birthDate: formData.birthDate instanceof Date
      ? formData.birthDate.toISOString().split('T')[0]
      : (formData.birthDate || null),
    genderId: formData.genderId?.value || null,
    gradeId: formData.gradeId?.value || null,
  };
  if (isDuplicate(formatted)) {
    toast({ message: `${formatted.firstName} ${formatted.lastName} est déjà dans cette catégorie.`, color: 'warning', position: 'top-center' });
    return;
  }
  try {
    const existing = findExistingInTournament(formatted);
    let newId;
    if (existing) {
      await ParticipantService.updateParticipantCategory(existing.id, props.category.id);
      unassigned.value.push({ ...existing, categoryId: props.category.id });
      showParticipantModal.value = false;
      emit('participants-changed');
      toast({ message: 'Participant réassigné à la catégorie.', color: 'success', position: 'top-center' });
      return;
    }
    newId = await ParticipantService.createParticipant(props.tournamentId, formatted);
    await ParticipantService.updateParticipantCategory(newId, props.category.id);
    unassigned.value.push({ id: newId, ...formatted, categoryId: props.category.id });
    allTournamentParticipants.value.push({ id: newId, ...formatted });
    showParticipantModal.value = false;
    emit('participants-changed');
    toast({ message: 'Participant créé et ajouté.', color: 'success', position: 'top-center' });
  } catch (e) {
    console.error(e);
  }
};

// === IMPORT CSV ===
const parseDate = (raw) => {
  if (!raw) return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return isNaN(new Date(s + 'T12:00:00')) ? null : s;
  }
  const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[2]}-${m[1]}`;
    return isNaN(new Date(iso + 'T12:00:00')) ? null : iso;
  }
  return null;
};

const importFromCSV = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const raw = e.target.result.replace(/^\uFEFF/, '');
    const rows = raw.split('\n').map(r => r.replace(/\r$/, '').split(';'));
    const expected = ['firstName', 'lastName', 'birthDate', 'genderId', 'gradeId', 'clubName', 'weight', 'nationalityId'];
    const fileHeaders = rows.shift().map(h => h.replace(/"/g, '').trim());
    if (JSON.stringify(fileHeaders) !== JSON.stringify(expected)) {
      toast({ message: 'Format incorrect : colonnes attendues : prenom ; nom ; dateNaissance ; genre ; grade ; club ; poids ; nationalite', color: 'danger', position: 'top-center', duration: 6000 });
      csvInputRef.value.value = '';
      return;
    }
    const participants = rows.map(row => {
      if (row.length !== expected.length || row.every(c => c.replace(/"/g, '').trim() === '')) return null;
      const cell = (i) => row[i].replace(/"/g, '').trim();
      return { firstName: cell(0), lastName: cell(1), birthDate: parseDate(cell(2)), genderId: Number(cell(3)) || null, gradeId: Number(cell(4)) || null, clubName: cell(5), weight: Number(cell(6).replace(',', '.')) || null, nationalityId: Number(cell(7)) || null };
    }).filter(Boolean);
    if (!participants.length) {
      toast({ message: 'Aucune ligne valide.', color: 'danger', position: 'top-center' });
      csvInputRef.value.value = '';
      return;
    }
    csvParticipants.value = participants;
    showImportModal.value = true;
    csvInputRef.value.value = '';
  };
  reader.readAsText(file, 'UTF-8');
};

const handleConfirmImport = async (selected) => {
  let successCount = 0;
  for (const p of selected) {
    const formatted = {
      ...p,
      birthDate: p.birthDate || null,
      genderId: typeof p.genderId === 'object' ? p.genderId?.value : p.genderId,
      gradeId: typeof p.gradeId === 'object' ? p.gradeId?.value : p.gradeId,
    };
    try {
      const existing = findExistingInTournament(formatted);
      if (existing) {
        // participant existe déjà dans le tournoi → juste réassigner à la catégorie
        await ParticipantService.updateParticipantCategory(existing.id, props.category.id);
        unassigned.value.push({ ...existing, categoryId: props.category.id });
      } else {
        // nouveau participant → créer et assigner
        const newId = await ParticipantService.createParticipant(props.tournamentId, formatted);
        await ParticipantService.updateParticipantCategory(newId, props.category.id);
        unassigned.value.push({ id: newId, ...formatted, categoryId: props.category.id });
        allTournamentParticipants.value.push({ id: newId, ...formatted });
      }
      successCount++;
    } catch (e) {
      toast({ message: `${p.firstName} ${p.lastName} impossible à importer`, color: 'danger', position: 'top-center' });
    }
  }
  showImportModal.value = false;
  emit('participants-changed');
  if (successCount > 0) toast({ message: `${successCount} participant(s) importé(s).`, color: 'success', position: 'top-center' });
};
</script>

<style scoped>
.config-modal {
  display: flex;
  flex-direction: column;
  height: 80vh;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

/* en-tete */
.config-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8ecef;
}

.config-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.config-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0c2432;
  margin: 0;
}

.stats-chips {
  display: flex;
  gap: 8px;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f1f3f5;
  border: 1px solid #dee2e6;
  min-width: 56px;
}

.stat-chip--total { background: #e8ecef; border-color: #ced4da; }
.stat-chip--ok    { background: #d3f9d8; border-color: #69db7c; }
.stat-chip--warn  { background: #fff3bf; border-color: #fcc419; }

.stat-chip-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.stat-chip-label {
  font-size: 0.65rem;
  color: #868e96;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 0.85rem;
  color: #555;
  white-space: nowrap;
}

.nb-pools-input {
  width: 58px;
  padding: 5px 8px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  background: #fff;
  transition: border-color 0.15s;
}

.nb-pools-input:focus {
  outline: none;
  border-color: #0c2432;
}

/* alertes / banners */
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  flex-shrink: 0;
  border-left: 4px solid;
}

.alert-banner--warning {
  background: #fff9db;
  border-color: #f59f00;
  color: #7d5a00;
}

.alert-banner--info {
  background: #e7f5ff;
  border-color: #339af0;
  color: #1864ab;
}

.alert-banner--danger {
  background: #fff5f5;
  border-color: #fa5252;
  color: #c92a2a;
}

.alert-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}


/* grille des poules */
.pools-grid {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-height: 0;
  padding-bottom: 8px;
}

/* colonne generique */
.pool-col {
  min-width: 180px;
  max-width: 220px;
  flex-shrink: 0;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, background 0.15s;
  overflow: hidden;
}

.pool-col:not(.unassigned-col):not(.add-pool-col) {
  cursor: default;
}

.pool-col.dropzone-active {
  border-color: #1976d2;
  background: #e3f2fd;
  cursor: pointer;
}

.unassigned-col {
  background: #fff8e1;
}

.unassigned-col.dropzone-active {
  border-color: #f57c00;
  background: #fff3e0;
  cursor: pointer;
}

/* en-tete de colonne */
.pool-col-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.unassigned-header {
  background: rgba(245, 124, 0, 0.12);
}

.col-title {
  font-weight: 700;
  font-size: 0.85rem;
  flex: 1;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-count {
  background: #0c2432;
  color: white;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.remove-pool-btn {
  background: none;
  border: none;
  color: #c62828;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}

.remove-pool-btn:hover { color: #b71c1c; }

/* liste des participants dans une colonne */
.participants-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* chip participant */
.participant-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: white;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, transform 0.1s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  gap: 6px;
}

.participant-chip:hover {
  border-color: #90caf9;
  transform: translateY(-1px);
}

.participant-chip.chip-selected {
  border-color: #1976d2;
  background: #e3f2fd;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
}

.chip-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #222;
  flex: 1;
  line-height: 1.2;
}

.chip-meta {
  font-size: 0.72rem;
  color: #888;
  flex-shrink: 0;
  white-space: nowrap;
}

.empty-label {
  font-size: 0.78rem;
  color: #aaa;
  text-align: center;
  padding: 12px 4px;
  font-style: italic;
}

/* colonne ajouter une poule */
.add-pool-col {
  min-width: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-pool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: none;
  border: 2px dashed #90caf9;
  border-radius: 8px;
  color: #1976d2;
  cursor: pointer;
  font-size: 0.8rem;
  text-align: center;
  line-height: 1.3;
  transition: background 0.15s, border-color 0.15s;
}

.add-pool-btn:hover {
  background: #e3f2fd;
  border-color: #1976d2;
}

.add-icon {
  font-size: 1.6rem;
  font-weight: bold;
  line-height: 1;
}

.hidden-input {
  display: none;
}

.chip-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 3px;
  line-height: 1;
  font-size: 0.85rem;
  flex-shrink: 0;
  border-radius: 3px;
  transition: background 0.12s;
}

.chip-info {
  color: #1976d2;
}

.chip-info:hover {
  background: #e3f2fd;
}

.chip-remove {
  color: #c62828;
  font-size: 1rem;
  font-weight: bold;
}

.chip-remove:hover {
  background: #ffebee;
}

/* pied de modal */
.config-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding-top: 12px;
  border-top: 2px solid #e8ecef;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-hint {
  font-size: 0.82rem;
  color: #f59f00;
  font-weight: 600;
}
</style>
