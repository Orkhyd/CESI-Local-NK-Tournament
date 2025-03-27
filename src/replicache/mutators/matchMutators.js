import { Match } from "@/replicache/models/Match";
import { registerMutators } from "../replicache";

const matchMutators = {
  create: async (tx, { idMatch, idMatchType, idRound, idPool, idPlayer1, idPlayer2, idPreviousMatch1, idPreviousMatch2, ipponsPlayer1, ipponsPlayer2, keikokusPlayer1, keikokusPlayer2, idWinner }) => {
    await tx.put(`match/${idMatch}`, new Match(
      idMatch,
      idMatchType,
      idRound,
      idPool,
      idPlayer1,
      idPlayer2,
      idPreviousMatch1,
      idPreviousMatch2,
      ipponsPlayer1 || 0,
      ipponsPlayer2 || 0,
      keikokusPlayer1 || 0,
      keikokusPlayer2 || 0,
      idWinner || null,
    ));
  },

  update: async (tx, { idMatch, ...updates }) => {
    const match = await tx.get(`match/${idMatch}`);
    if (!match) return;

    const updatedMatch = {
      ...match,
      ...updates,
      idWinner: updates.idWinner ?? match.idWinner,
    };

    await tx.put(`match/${idMatch}`, updatedMatch);
  },

  delete: async (tx, { idMatch }) => {
    await tx.del(`match/${idMatch}`);
  },

  updateTimer: async (tx, { idMatch, isRunning, currentTime, additionalTime }) => {
    const match = await tx.get(`match/${idMatch}`);
    if (!match) return;

    const updatedMatch = {
      ...match,
      timer: {
        ...match.timer,
        isRunning: isRunning ?? match.timer.isRunning,
        currentTime: currentTime ?? match.timer.currentTime,
        additionalTime: additionalTime ?? match.timer.additionalTime,
      },
    };

    await tx.put(`match/${idMatch}`, updatedMatch);
  },
};
registerMutators(matchMutators);
export default matchMutators;
