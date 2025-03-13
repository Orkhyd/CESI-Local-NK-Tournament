// poolService.js
import { rep } from "@/replicache/stores/Pool/poolStore";

export const poolService = {
  // crée une poule
  create: async ({ poolManagerId, label, participants, qualifyingPositions }) => {
    const idPoule = crypto.randomUUID();
    await rep.mutate.createPoule({
      id: idPoule,
      poolManagerId,
      label,
      participants,
      qualifyingPositions,
    });
    return idPoule;
  },

  // met à jour une poule
  update: async (idPoule, updates) => {
    await rep.mutate.updatePoule({ id: idPoule, ...updates });
  },

  // supp une poule
  delete: async (idPoule) => {
    await rep.mutate.deletePoule({ id: idPoule });
  },
};