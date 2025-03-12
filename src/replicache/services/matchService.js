import { rep } from "@/replicache/stores/matchStore";

export const matchService = {
  create: async (data) => {
    await rep.mutate.create({ ...data });
  },

  update: async (idMatch, updates) => {
    await rep.mutate.update({ idMatch, ...updates });

    // Si un gagnant est défini, on propage aux matchs suivants
    if (updates.idWinner) {
      await propagateWinner(idMatch, updates.idWinner);
    }
  },


  delete: async (idMatch) => {
    await rep.mutate.delete({ idMatch });
  },

  startTimer: async (idMatch) => {
    await rep.mutate.updateTimer({ idMatch, isRunning: true });
  },

  stopTimer: async (idMatch) => {
    await rep.mutate.updateTimer({ idMatch, isRunning: false });
  },

  resetTimer: async (idMatch) => {
    await rep.mutate.updateTimer({ idMatch, currentTime: 180, additionalTime: 0, isRunning: false });
  },

  addTime: async (idMatch, seconds) => {
    const match = await rep.query(async (tx) => await tx.get(`match/${idMatch}`));
    if (!match) return;

    const newTime = match.timer.currentTime + seconds;
    await rep.mutate.updateTimer({ idMatch, currentTime: newTime });
  },

  setAdditionalTime: async (idMatch, seconds) => {
    await rep.mutate.updateTimer({ idMatch, additionalTime: seconds });
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
