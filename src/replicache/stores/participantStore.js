import { getReplicache } from "../replicache";

// récup ts les participants pr un tournoi donne
export async function getParticipantsByTournament(tournamentId) {
  const rep = getReplicache();
  if (!rep) return [];

  return await rep.query(async tx => {
    const participants = [];

    // scan ts les participants enreg et filtre pr le tournoi donne
    for await (const value of tx.scan()) {
      if (value?.tournamentId === tournamentId) {
        participants.push(value);
      }
    }

    return participants;
  });
}

// recup tout les participants d une categorie
export async function getParticipantsByCategory(tournamentId, categoryId) {
  const rep = getReplicache();
  if (!rep) return [];

  return await rep.query(async tx => {
    const participants = [];

    // parcours de tous les participants stockeees dans Replicache
    for await (const value of tx.scan()) {
      // filtre des participants appartenant au tournoi et à la catego spécifiés
      if (value?.tournamentId === tournamentId && value?.categoryId === categoryId) {
        participants.push(value);
      }
    }
    return participants;
  });
}

// recup un participant par son id
export async function getParticipantById(id) {
  const rep = getReplicache();
  // verif que l'instance Replicache est prête
  if (!rep) return null;

  // recup le participant dans Replicache via sa clé
  return await rep.query(async (tx) => {
    return await tx.get(`participant/${id}`);
  });
}

