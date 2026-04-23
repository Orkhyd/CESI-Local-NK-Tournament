import { ref } from 'vue';

// Singleton partagé entre tous les composants
const status = ref({ isOpen: false, currentMatchId: null });
let initialized = false;

export function useScoreboardStatus() {
  if (!initialized && window.electron?.getScoreboardStatus) {
    initialized = true;

    // Récupérer le statut initial
    window.electron.getScoreboardStatus().then(s => {
      if (s) status.value = s;
    });

    // S'abonner aux changements (pas de cleanup car singleton lifetime)
    window.electron.onScoreboardStatusChanged(s => {
      status.value = s;
    });
  }

  /**
   * Envoie un match au scoreboard persistant.
   * Affiche une confirmation si un autre match est déjà en cours.
   * @param {object} matchData - données du match à envoyer
   * @returns {Promise<boolean>} true si envoyé, false si annulé
   */
  const sendMatchToScoreboard = async (matchData) => {
    if (!window.electron) return false;

    const currentId = status.value.currentMatchId;
    const newId = matchData.idMatch;

    if (currentId && currentId !== newId && status.value.isOpen) {
      // Un autre match est déjà dans le scoreboard → confirmation
      const confirmed = window.confirm(
        'Le scoreboard affiche déjà un autre combat.\nVoulez-vous le remplacer par celui-ci ?'
      );
      if (!confirmed) return false;
    }

    window.electron.setScoreboardMatch(matchData);
    return true;
  };

  return {
    scoreboardStatus: status,
    sendMatchToScoreboard,
  };
}
