import { Replicache } from 'replicache';
import { Tournament } from '../models';

export const rep = new Replicache({
  name: 'tournament',
  licenseKey: 'l70ce33fc0dee46abb6f056086da4d872',
  mutators: {
    create: async (tx, { id, name, startDate }) => {
      await tx.put(`tournament/${id}`, new Tournament(id, name, startDate));
    },
    delete: async (tx, { id }) => {
      await tx.del(`tournament/${id}`);
    },
    toggleState: async (tx, { id, started }) => {
      const t = await tx.get(`tournament/${id}`);
      if (t) await tx.put(`tournament/${id}`, { ...t, started });
    },
  },
});

export async function getTournaments(rep) {
  return await rep.query(async tx => {
    const tournaments = [];
    for await (const value of tx.scan({ prefix: "tournament/" })) {  
      if (!value || typeof value !== "object") {
        continue;
      }
      tournaments.push(value);
    }
    return tournaments;
  });
}






