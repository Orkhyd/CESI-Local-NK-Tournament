<template>
  <div class="pools-container">
    <!-- Titre + bouton de régénération -->
    <div class="header">
      <h2>Gestion multiphase des poules</h2>
      <button @click="confirmRefresh" class="btn refresh">Regénérer</button>
    </div>

    <!-- Vue de chargement -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Génération des poules...</p>
    </div>

    <!-- Vue vide -->
    <div v-else-if="phases.length === 0" class="empty-state">
      <p>Aucune poule générée</p>
      <button @click="loadInitialPhase" class="btn primary">
        Générer les poules
      </button>
    </div>

    <!-- Affichage de toutes les phases -->
    <div v-else>
      <div v-for="(phase, phaseIndex) in phases" :key="`phase_${phaseIndex}`" class="phase-block">
        <h2>{{ phase.label }}</h2>
        <div class="pools-grid">
          <Pool v-for="(pool, idx) in phase.pools" :key="`pool_${phaseIndex}_${idx}`" :pool="pool"
            @edit-match="showMatchEditor" />
        </div>

        <!-- Bouton "Générer la phase suivante" 
             UNIQUEMENT pour la dernière phase 
             ET seulement s'il y a + d'une poule -->
        <div v-if="isLastPhase(phaseIndex) && phase.pools.length > 1" class="final-phase">
          <hr />
          <button class="btn primary large" @click="generateNextPhase">
            Générer la phase suivante (vainqueurs)
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'édition de match -->
    <div v-if="matchEditorOpen" class="modal">
      <div class="modal-backdrop" @click="closeMatchEditor"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Éditer le match</h3>
          <button @click="closeMatchEditor" class="close-btn">&times;</button>
        </div>

        <div v-if="currentMatch" class="modal-body">
          <div class="match-players">
            <div class="player">{{ currentMatch.player1?.lastName }}</div>
            <div class="vs">VS</div>
            <div class="player">{{ currentMatch.player2?.lastName }}</div>
          </div>

          <div class="form">
            <div class="form-row">
              <div class="field">
                <label>Score</label>
                <input type="number" min="0" v-model.number="editedMatch.score1" />
              </div>
              <div class="field">
                <label>Score</label>
                <input type="number" min="0" v-model.number="editedMatch.score2" />
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label>Keikoku</label>
                <select v-model.number="editedMatch.keikoku1">
                  <option :value="0">0</option>
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                </select>
              </div>
              <div class="field">
                <label>Keikoku</label>
                <select v-model.number="editedMatch.keikoku2">
                  <option :value="0">0</option>
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>Vainqueur</label>
              <select v-model="editedMatch.winner">
                <option :value="null">Non défini</option>
                <option :value="currentMatch.player1?.id">
                  {{ currentMatch.player1?.lastName }}
                </option>
                <option :value="currentMatch.player2?.id">
                  {{ currentMatch.player2?.lastName }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeMatchEditor" class="btn">Annuler</button>
          <button @click="saveMatch" class="btn primary">Sauvegarder</button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation (pour régénérer) -->
    <div v-if="confirmDialogOpen" class="modal">
      <div class="modal-backdrop" @click="cancelConfirmation"></div>
      <div class="modal-content confirm">
        <div class="modal-header">
          <h3>Confirmation</h3>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelConfirmation" class="btn">Annuler</button>
          <button @click="confirmAction" class="btn primary">Confirmer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Pool from "./Pool.vue";
import {
  generatePools,
  updatePoolStandings,
  generateFinalistPool,
} from "@/functions/generatePools";
// Chemin à ajuster selon ton arborescence réelle

export default {
  name: "PoolList",
  components: { Pool },
  props: {
    participants: {
      type: Array,
      required: true,
    },
    // Optionnel : si tu veux paramétrer autrement, mais ici on force 3..6 dans generatePools
    // maxPoolSize: {
    //   type: Number,
    //   default: 6,
    // },
  },
  data() {
    return {
      loading: false,

      // On stocke toutes les phases dans un tableau.
      // phases[0] => phase initiale
      // phases[1] => 2e phase, etc.
      // Chacune est : { label: string, pools: [...] }
      phases: [],

      // Modaux
      matchEditorOpen: false,
      currentMatch: null,
      editedMatch: {},

      // Dialog de confirmation
      confirmDialogOpen: false,
      confirmMessage: "",
      confirmCallback: null,
    };
  },
  mounted() {
    // On peut charger directement la phase initiale,
    // ou laisser l'utilisateur cliquer sur "Générer".
    // this.loadInitialPhase();
  },
  methods: {
    //----------------------------------------------------------------------
    // 1) Crée la première phase (poules initiales)
    //----------------------------------------------------------------------
    loadInitialPhase() {
      this.loading = true;
      try {
        // Ici, on ne passe plus de poolSize, c'est géré par generatePools (3..6)
        const result = generatePools(this.participants);
        const initialPools = result.structure;

        this.phases = [
          {
            label: "Phase 1 (Poules initiales)",
            pools: initialPools,
          },
        ];
      } catch (error) {
        console.error("Erreur lors de la génération des poules:", error);
        alert("Erreur lors de la génération des poules");
      } finally {
        this.loading = false;
      }
    },

    //----------------------------------------------------------------------
    // 2) Génère la phase suivante (on prend le dernier bloc, on fait la suite)
    //----------------------------------------------------------------------
    generateNextPhase() {
      // Récupérer la dernière phase existante
      const lastIndex = this.phases.length - 1;
      const lastPhase = this.phases[lastIndex];

      // Vérifier si on a plus d'une poule => sinon, pas utile/possible
      if (lastPhase.pools.length <= 1) {
        alert("Il n'y a qu'une seule poule dans cette phase; pas de phase suivante.");
        return;
      }

      // Exiger que toutes les poules soient terminées
      const allDone = lastPhase.pools.every((p) => p.isComplete);
      if (!allDone) {
        alert("Toutes les poules de la phase précédente doivent être terminées.");
        return;
      }

      // Générer la nouvelle phase (finalistes)
      const nextPools = generateFinalistPool(lastPhase.pools, 1);

      // Optionnel: recalculer standings
      nextPools.forEach((pool) => {
        updatePoolStandings(pool);
      });

      // Numéro de la nouvelle phase
      const newPhaseNumber = this.phases.length + 1;

      this.phases.push({
        label: `Phase ${newPhaseNumber}`,
        pools: nextPools,
      });

      console.log(`→ Génération de la phase ${newPhaseNumber}`, nextPools);
    },

    //----------------------------------------------------------------------
    // 3) Confirmation pour régénérer toute la structure depuis zéro
    //----------------------------------------------------------------------
    confirmRefresh() {
      this.showConfirmation(
        "Voulez-vous vraiment regénérer les poules ? Tous les résultats seront perdus.",
        () => {
          this.phases = [];
          this.loadInitialPhase();
        }
      );
    },
    showConfirmation(message, callback) {
      this.confirmMessage = message;
      this.confirmCallback = callback;
      this.confirmDialogOpen = true;
    },
    confirmAction() {
      if (this.confirmCallback) {
        this.confirmCallback();
      }
      this.cancelConfirmation();
    },
    cancelConfirmation() {
      this.confirmDialogOpen = false;
      this.confirmMessage = "";
      this.confirmCallback = null;
    },

    //----------------------------------------------------------------------
    // 4) Éditer un match (ouvre le modal)
    //----------------------------------------------------------------------
    showMatchEditor(match) {
      this.currentMatch = match;
      this.editedMatch = {
        score1: match.score1,
        score2: match.score2,
        keikoku1: match.keikoku1,
        keikoku2: match.keikoku2,
        winner: match.winner,
      };
      this.matchEditorOpen = true;
    },
    closeMatchEditor() {
      this.matchEditorOpen = false;
      this.currentMatch = null;
      this.editedMatch = {};
    },

    //----------------------------------------------------------------------
    // 5) Sauvegarder un match => impose un "ippon" si winner != null
    //----------------------------------------------------------------------
    saveMatch() {
      if (!this.currentMatch) return;

      // Retrouver la poule concernée (dans n'importe quelle phase)
      const foundPool = this.findPoolByMatchId(this.currentMatch.idMatch);
      if (!foundPool) {
        console.log("‼️ Aucune poule trouvée pour ce match => pas de mise à jour.");
        this.closeMatchEditor();
        return;
      }

      // Mettre à jour le match
      const matchIndex = foundPool.matches.findIndex(
        (m) => m.idMatch === this.currentMatch.idMatch
      );
      if (matchIndex === -1) {
        console.log("‼️ Match introuvable => pas de mise à jour.");
        this.closeMatchEditor();
        return;
      }

      const matchToUpdate = foundPool.matches[matchIndex];
      matchToUpdate.score1 = this.editedMatch.score1;
      matchToUpdate.score2 = this.editedMatch.score2;
      matchToUpdate.keikoku1 = this.editedMatch.keikoku1;
      matchToUpdate.keikoku2 = this.editedMatch.keikoku2;
      matchToUpdate.winner = this.editedMatch.winner;

      // Recalculer standings
      updatePoolStandings(foundPool);

      // Fermer le modal
      this.closeMatchEditor();
    },

    //----------------------------------------------------------------------
    // 6) Utilitaire : retrouver la poule où se trouve un match donné
    //----------------------------------------------------------------------
    findPoolByMatchId(matchId) {
      for (let phase of this.phases) {
        for (let pool of phase.pools) {
          if (pool.matches.some((m) => m.idMatch === matchId)) {
            return pool;
          }
        }
      }
      return null;
    },

    //----------------------------------------------------------------------
    // 7) Savoir si c'est la "dernière" phase => pour afficher le bouton
    //----------------------------------------------------------------------
    isLastPhase(phaseIndex) {
      return phaseIndex === this.phases.length - 1;
    },
  },
};
</script>

<style scoped>
.pools-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.3s;
}

.btn:hover {
  background: #e9ecef;
}

.btn.primary {
  background: #4285f4;
  color: white;
  border-color: #3367d6;
}

.btn.primary:hover {
  background: #3367d6;
}

.btn.large {
  font-size: 1rem;
  padding: 10px 20px;
}

.btn.refresh {
  display: flex;
  align-items: center;
}

.btn.refresh::before {
  content: "↻";
  margin-right: 5px;
}

/* States */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(66, 133, 244, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* Phases / Pools layout */
.phase-block {
  margin-bottom: 40px;
}

.pools-grid {
  display: grid;
  gap: 20px;
}

.final-phase {
  margin-top: 20px;
  text-align: center;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.modal-content.confirm {
  max-width: 400px;
}

.modal-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 15px;
}

.modal-footer {
  padding: 12px 15px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Form */
.match-players {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.player {
  font-weight: 500;
}

.vs {
  color: #666;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field label {
  font-size: 0.9rem;
  color: #666;
}

.field input,
.field select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
