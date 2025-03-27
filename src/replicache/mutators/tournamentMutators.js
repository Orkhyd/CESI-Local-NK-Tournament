import { Tournament } from '../models';
import { registerMutators } from '../replicache';

const tournamentMutators = {
  createTournament: async (tx, { id, name, startDate }) => {
    await tx.put(`tournament/${id}`, new Tournament(id, name, startDate));
  },
  deleteTournament: async (tx, { id }) => {
    await tx.del(`tournament/${id}`);
  },
  toggleState: async (tx, { id, started }) => {
    const t = await tx.get(`tournament/${id}`);
    if (t) await tx.put(`tournament/${id}`, { ...t, started });
  },
};

registerMutators(tournamentMutators);
export default tournamentMutators;
