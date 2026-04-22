import { replicacheInstance as rep } from "@/replicache/replicache";
import { getMatchesByPool } from "@/replicache/stores/matchStore";
import { matchService } from "@/replicache/services/matchService";

export const poolService = {
  // crée une poule
  createPool: async ({ poolManagerId, label, qualifyingPositions, participants }) => {
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
    await rep.mutate.updatePool({ id: idPool, ...updates });
  },

  // supp une poule et tous ses matchs
  deletePool: async (idPool) => {
    const matches = await getMatchesByPool(idPool);
    for (const match of matches) {
      await matchService.deleteMatch(match.idMatch);
    }
    await rep.mutate.deletePool({ id: idPool });
  },
};
