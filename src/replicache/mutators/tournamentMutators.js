import { Tournament } from '../models';

const tournamentMutators = {
  createTournament: async (tx, { id, name, startDate }) => {
    await tx.set(`tournament/${id}`, new Tournament(id, name, startDate));
  },
  deleteTournament: async (tx, { id }) => {
    await tx.del(`tournament/${id}`);
  },
  toggleState: async (tx, { id, started }) => {
    const t = await tx.get(`tournament/${id}`);
    if (t) await tx.set(`tournament/${id}`, { ...t, started });
  },
};

export default tournamentMutators;
