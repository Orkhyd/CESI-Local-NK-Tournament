<template>
  <VaModal v-model="isOpen" size="large" hide-default-actions no-outside-dismiss no-esc-dismiss
    @update:model-value="val => !val && cancel()">
    <template #content>
      <div class="config-modal">

        <!-- en-tete -->
        <div class="config-header">
          <h2 class="config-title">Configuration des poules</h2>
          <div class="toolbar">
            <div class="auto-generate-group">
              <span class="toolbar-label">Nombre de poules :</span>
              <input
                v-model.number="targetNbPools"
                type="number"
                :min="1"
                :max="allCategoryParticipants.length"
                class="nb-pools-input"
              />
              <VaButton @click="autoGenerate" icon="auto_fix_high" color="secondary" size="small">
                Auto-generer
              </VaButton>
            </div>
            <div class="stats-bar">
              <span>{{ allCategoryParticipants.length }} participants au total</span>
              <span class="stat-sep">|</span>
              <span class="stat-ok">{{ assignedCount }} assignes</span>
              <span class="stat-sep">|</span>
              <span :class="unassigned.length > 0 ? 'stat-warn' : 'stat-ok'">
                {{ unassigned.length }} non assignes
              </span>
            </div>
          </div>
        </div>

        <!-- avertissement si des matchs existent deja -->
        <div v-if="hasExistingMatches" class="warning-banner">
          Attention : des matchs ont deja ete joues dans cette configuration. Valider supprimera tous les resultats existants et regenerera les matchs.
        </div>

        <!-- indication de selection active -->
        <div v-if="selected" class="selection-hint">
          <strong>{{ selected.participant.lastName }} {{ selected.participant.firstName }}</strong> selectionne
          — cliquez sur une poule pour le/la deplacer, ou cliquez a nouveau sur lui/elle pour annuler.
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
          <VaButton color="secondary" @click="cancel" :disabled="saving">Annuler</VaButton>
          <VaButton
            color="success"
            @click="validate"
            :loading="saving"
            :disabled="unassigned.length > 0"
            :title="unassigned.length > 0 ? 'Tous les participants doivent etre assignes a une poule' : ''"
          >
            Valider la configuration
          </VaButton>
        </div>

      </div>
    </template>
  </VaModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { generatePools } from '@/functions/generatePools';
import { poolManagerService } from '@/replicache/services/Pool/poolManagerService';
import { getMatchesByPool } from '@/replicache/stores/matchStore';

const props = defineProps({
  modelValue:              { type: Boolean, required: true },
  poolManagerId:           { type: String, required: true },
  allPools:                { type: Array, required: true },  // toutes les poules existantes
  allCategoryParticipants: { type: Array, required: true },  // tous les participants de la categorie
});

const emit = defineEmits(['update:modelValue', 'saved']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// === ETAT LOCAL ===
const editablePools = ref([]);   // [{id, label, participants: [...]}]
const unassigned = ref([]);      // participants pas dans une poule
const selected = ref(null);      // {participant, fromPool: -1|poolIndex}
const saving = ref(false);
const hasExistingMatches = ref(false);
const targetNbPools = ref(1);

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

  // verifier si des matchs ont deja ete joues
  let foundMatch = false;
  for (const pool of editable) {
    if (foundMatch) break;
    const matches = await getMatchesByPool(pool.id);
    if (matches.some(m => m.idWinner !== null)) {
      foundMatch = true;
    }
  }
  hasExistingMatches.value = foundMatch;
};

onMounted(initFromExistingPools);

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

  editablePools.value = generated.structure
    .filter(p => p.label !== 'Poule Finale' || generated.structure.length === 1)
    .map((p, i) => ({
      id: editablePools.value[i]?.id || null,
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
    await poolManagerService.applyPoolConfiguration(
      props.poolManagerId,
      editablePools.value
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
  gap: 8px;
  flex-shrink: 0;
}

.config-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: #0c2432;
  margin: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.auto-generate-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 0.9rem;
  color: #555;
}

.nb-pools-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #555;
}

.stat-sep { color: #ccc; }
.stat-ok  { color: #2e7d32; font-weight: 600; }
.stat-warn { color: #e65100; font-weight: 600; }

/* avertissement */
.warning-banner {
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #e65100;
  flex-shrink: 0;
}

/* indication de selection */
.selection-hint {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #1565c0;
  flex-shrink: 0;
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

/* pied de modal */
.config-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}
</style>
