import { rep } from "@/replicache/stores/Pool/poolManagerStore";
import { generatePools } from "@/functions/generatePools";
import { poolService } from "@/replicache/services/Pool/poolService";
import { matchService } from "@/replicache/services/matchService";

export const poolManagerService = {
  create: async (categoryId, participants) => {
    const idPoolManager = crypto.randomUUID();

    // genere des poules avec la fonction centrale
    const generatedPools = generatePools(participants);

    // save de l'instance de PoolManager
    await rep.mutate.createPoolManager({
      id: idPoolManager,
      categoryId,
    });

    // crea des poules et des matchs
    for (const pool of generatedPools.structure) {
      // creee une poule via PoolService
      const idPool = await poolService.create({
        poolManagerId: idPoolManager,
        label: pool.label,
        qualifyingPositions: pool.qualifyingPositions,
        participants: pool.participants
      });

      // cree les matchs de la poule via MatchService
      for (const match of pool.matches) {
        await matchService.create({
          idMatch: match.idMatch,
          idRound: null,
          idPool,
          idMatchType: 2, // type poule
          idPlayer1: match.player1 ? match.player1.id : -2,
          idPlayer2: match.player2 ? match.player2.id : -2,
          winner: match.winner,
        });
      }
    }

    return idPoolManager;
  },

  // supp une instance de PoolManager et ses poules
  delete: async (poolManagerId) => {
    const poules = await poolService.getPoulesByPoolManagerId(poolManagerId);
    for (const poule of poules) {
      await poolService.delete(poule.id);
    }
    await rep.mutate.deletePoolManager({ id: poolManagerId });
  },
};