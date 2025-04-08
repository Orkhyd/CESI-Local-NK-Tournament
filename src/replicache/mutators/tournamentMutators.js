import { Tournament } from '../models';

const tournamentMutators = {
  createTournament: async (tx, { id, name, address, startDate }) => {
    await tx.set(`tournament/${id}`, new Tournament(id, name, address, startDate));
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
