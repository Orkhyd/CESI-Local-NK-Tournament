import { rep } from "@/replicache/stores/matchStore";

export const matchService = {
  create: async (data) => {
    await rep.mutate.create({ ...data });
  },

  update: async (idMatch, updates) => {
    await rep.mutate.update({ idMatch, ...updates });

    // si un gagnant est défini, propager aux matchs suivants
    if (updates.idWinner) {
      await propagateWinner(idMatch, updates.idWinner);
    }
  },

  delete: async (idMatch) => {
    await rep.mutate.delete({ idMatch });
  },
};

/* met a jouur les matchs suivants en assignant le gagnant dans idPlayer1 ou idPlayer2  */
 
async function propagateWinner(idMatch, idWinner) {
  const allMatches = await rep.query(async (tx) => {
    const matches = [];
    for await (const value of tx.scan()) {
      matches.push(value);
    }
    return matches;
  });

  // trouve les matchs suivants qui dépendent du match gagné
  const matchesToUpdate = allMatches.filter(
    (m) => m.idPreviousMatch1 === idMatch || m.idPreviousMatch2 === idMatch
  );

  for (const match of matchesToUpdate) {
    const updatedMatch = { ...match };

    if (updatedMatch.idPreviousMatch1 === idMatch) {
      updatedMatch.idPlayer1 = idWinner;
    }
    if (updatedMatch.idPreviousMatch2 === idMatch) {
      updatedMatch.idPlayer2 = idWinner;
    }

    // maj des matchs suivants dans replicache
    await rep.mutate.update({ idMatch: match.idMatch, ...updatedMatch });
  }
}
