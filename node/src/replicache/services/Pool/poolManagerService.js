import { poolService } from "@/replicache/services/Pool/poolService";
import { matchService } from "@/replicache/services/matchService";
import { getMatchesByPool } from "@/replicache/stores/matchStore";
import { getPoulesByPoolManagerId } from "@/replicache/stores/Pool/poolStore";
import { replicacheInstance as rep } from "@/replicache/replicache";

export const poolManagerService = {
  createPoolManager: async (categoryId) => {
    const idPoolManager = crypto.randomUUID();
    await rep.mutate.createPoolManager({ id: idPoolManager, categoryId });
    return idPoolManager;
  },

  // applique une nouvelle configuration de poules (deplace participants, regenere matchs)
  applyPoolConfiguration: async (poolManagerId, newEditablePools) => {
    const existingPools = await getPoulesByPoolManagerId(poolManagerId);
    const existingFinalPool = existingPools.find(p => p.label === "Poule Finale");
    const existingEditable = existingPools.filter(p => p.label !== "Poule Finale");
    const willBeMultiple = newEditablePools.length > 1;

    // 1. supprimer tous les matchs de toutes les poules editables existantes
    for (const pool of existingEditable) {
      const matches = await getMatchesByPool(pool.id);
      for (const match of matches) {
        await matchService.deleteMatch(match.idMatch);
      }
    }

    // 2. si on avait une seule poule (pas de Poule Finale séparée), supprimer ses matchs aussi
    if (!existingFinalPool && existingPools.length === 1) {
      const matches = await getMatchesByPool(existingPools[0].id);
      for (const match of matches) {
        await matchService.deleteMatch(match.idMatch);
      }
    }

    // 3. supprimer les poules editables qui ne sont plus dans la nouvelle config
    const keptIds = new Set(newEditablePools.filter(p => p.id).map(p => p.id));
    for (const pool of existingEditable) {
      if (!keptIds.has(pool.id)) {
        await poolService.deletePool(pool.id);
      }
    }
    // si on avait une seule poule et qu'on passe à plusieurs, supprimer cette poule
    if (!existingFinalPool && existingPools.length === 1 && willBeMultiple) {
      await poolService.deletePool(existingPools[0].id);
    }

    // 4. creer ou mettre a jour chaque poule et generer les matchs round-robin
    const qualifyingPositions = willBeMultiple ? [1] : [];
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

    // 5. gerer la poule finale
    if (willBeMultiple && existingFinalPool) {
      // reinitialiser la poule finale existante (multi → multi)
      const finalMatches = await getMatchesByPool(existingFinalPool.id);
      for (const match of finalMatches) {
        await matchService.deleteMatch(match.idMatch);
      }
      await poolService.updatePool(existingFinalPool.id, { participants: [], isComplete: false });
    } else if (!willBeMultiple && existingFinalPool) {
      // supprimer la poule finale séparée (multi → single)
      const finalMatches = await getMatchesByPool(existingFinalPool.id);
      for (const match of finalMatches) {
        await matchService.deleteMatch(match.idMatch);
      }
      await poolService.deletePool(existingFinalPool.id);
    } else if (willBeMultiple && !existingFinalPool) {
      // creer une poule finale (single → multi ou 0 → multi)
      await poolService.createPool({
        poolManagerId,
        label: "Poule Finale",
        qualifyingPositions: [],
        participants: [],
      });
    }
  },

  // supp une instance de PoolManager, ses poules et leurs matchs
  deletePoolManager: async (poolManagerId) => {
    const poules = await getPoulesByPoolManagerId(poolManagerId);
    for (const poule of poules) {
      await poolService.deletePool(poule.id); // cascade : supprime aussi les matchs
    }
    await rep.mutate.deletePoolManager({ id: poolManagerId });
  },
};
