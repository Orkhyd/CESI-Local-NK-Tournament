import { getReplicache } from "@/replicache/replicache";

export const poolService = {
  // crée une poule
  createPool: async ({ poolManagerId, label, qualifyingPositions, participants }) => {
    const rep = getReplicache();
    const idPool = crypto.randomUUID();
    await rep.mutate.createPool({
      id: idPool,
      poolManagerId,
      label,
      qualifyingPositions,
      participants
    });
    return idPool;
  },

  // met à jour une poule
  updatePool: async (idPool, updates) => {
    const rep = getReplicache();
    await rep.mutate.updatePool({ id: idPool, ...updates });
  },

  // supp une poule
  deletePool: async (idPool) => {
    const rep = getReplicache();
    await rep.mutate.deletePool({ id: idPool });
  },
};
