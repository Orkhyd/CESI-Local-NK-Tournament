import { generatePools } from "@/functions/generatePools";
import { poolService } from "@/replicache/services/Pool/poolService";
import { matchService } from "@/replicache/services/matchService";
import { getMatchesByPool } from "@/replicache/stores/matchStore";
import { getPoulesByPoolManagerId } from "@/replicache/stores/Pool/poolStore";
import { replicacheInstance as rep } from "@/replicache/replicache";

export const poolManagerService = {
  createPoolManager: async (categoryId, participants) => {
    const idPoolManager = crypto.randomUUID();

    // genere des poules avec la fonction centrale
    const generatedPools = generatePools(participants);

    // save de l'instance de PoolManager
    await rep.mutate.createPoolManager({
      id: idPoolManager,
      categoryId,
    });

    await Promise.all(generatedPools.structure.map(async (pool) => {
      // creee une poule via PoolService
      const idPool = await poolService.createPool({
        poolManagerId: idPoolManager,
        label: pool.label,
        qualifyingPositions: pool.qualifyingPositions,
        participants: pool.participants
      });

      await Promise.all(pool.matches.map(match =>
        matchService.createMatch({
          idMatch: match.idMatch,
          idRound: null,
          idPool,
          idMatchType: 1, // type poule
          idPlayer1: match.player1 ? match.player1.id : -2,
          idPlayer2: match.player2 ? match.player2.id : -2,
          winner: match.winner,
        })
      ));
    }));

    return idPoolManager;
  },

  // applique une nouvelle configuration de poules (deplace participants, regenere matchs)
  applyPoolConfiguration: async (poolManagerId, newEditablePools) => {
    const existingPools = await getPoulesByPoolManagerId(poolManagerId);
    const isMultiPool = existingPools.length > 1;
    const finalPool = isMultiPool ? existingPools.find(p => p.label === "Poule Finale") : null;
    const editableExisting = isMultiPool
      ? existingPools.filter(p => p.label !== "Poule Finale")
      : existingPools;

    // supprimer tous les matchs des poules modifiables existantes
    for (const pool of editableExisting) {
      const matches = await getMatchesByPool(pool.id);
      for (const match of matches) {
        await matchService.deleteMatch(match.idMatch);
      }
    }

    // supprimer les poules qui ne sont plus dans la nouvelle config
    const keptIds = new Set(newEditablePools.filter(p => p.id).map(p => p.id));
    for (const pool of editableExisting) {
      if (!keptIds.has(pool.id)) {
        await poolService.deletePool(pool.id);
      }
    }

    const willBeMultiple = newEditablePools.length > 1;
    const qualifyingPositions = willBeMultiple ? [1] : [];

    // creer ou mettre a jour chaque poule et generer les matchs round-robin
    for (const poolConfig of newEditablePools) {
      let poolId;
      if (poolConfig.id) {
        await poolService.updatePool(poolConfig.id, {
          participants: poolConfig.participants,
          qualifyingPositions,
          isComplete: false,
        });
        poolId = poolConfig.id;
      } else {
        poolId = await poolService.createPool({
          poolManagerId,
          label: poolConfig.label,
          qualifyingPositions,
          participants: poolConfig.participants,
        });
      }

      const parts = poolConfig.participants;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          await matchService.createMatch({
            idMatch: crypto.randomUUID(),
            idPool: poolId,
            idMatchType: 1,
            idPlayer1: parts[i].id,
            idPlayer2: parts[j].id,
          });
        }
      }
    }

    // gerer la poule finale
    if (isMultiPool && willBeMultiple && finalPool) {
      // reinitialiser la poule finale existante
      const finalMatches = await getMatchesByPool(finalPool.id);
      for (const match of finalMatches) {
        await matchService.deleteMatch(match.idMatch);
      }
      await poolService.updatePool(finalPool.id, { participants: [], isComplete: false });
    } else if (isMultiPool && !willBeMultiple && finalPool) {
      // supprimer la poule finale (on passe a une seule poule)
      const finalMatches = await getMatchesByPool(finalPool.id);
      for (const match of finalMatches) {
        await matchService.deleteMatch(match.idMatch);
      }
      await poolService.deletePool(finalPool.id);
    } else if (!isMultiPool && willBeMultiple) {
      // creer une poule finale (on passe de 1 poule a plusieurs)
      await poolService.createPool({
        poolManagerId,
        label: "Poule Finale",
        qualifyingPositions: [],
        participants: [],
      });
    }
  },

  // supp une instance de PoolManager et ses poules
  deletePoolManager: async (poolManagerId) => {
    const poules = await poolService.getPoulesByPoolManagerId(poolManagerId);
    for (const poule of poules) {
      await poolService.deletePool(poule.id);
    }
    await rep.mutate.deletePoolManager({ id: poolManagerId });
  },
};
