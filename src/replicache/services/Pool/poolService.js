// poolService.js
import { rep } from "@/replicache/stores/Pool/poolStore";

export const poolService = {
  // crée une poule
  create: async ({ poolManagerId, label, qualifyingPositions, participants }) => {
    const idPool = crypto.randomUUID();
    await rep.mutate.createPoule({
      id: idPool,
      poolManagerId,
      label,
      qualifyingPositions,
      participants
    });
    return idPool;
  },

  // met à jour une poule
  update: async (idPool, updates) => {
    await rep.mutate.updatePoule({ id: idPool, ...updates });
  },

  // supp une poule
  delete: async (idPool) => {
    await rep.mutate.deletePoule({ id: idPool });
  },
};