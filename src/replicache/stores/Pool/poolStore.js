import { getMatchesByPool } from "@/replicache/stores/matchStore";
import { determinePoolRanking } from "@/functions/determinePoolRanking";
import { matchService } from "@/replicache/services/matchService";
import { getPoolManagerById } from "./poolManagerStore";
import { ParticipantService } from "@/replicache/services/participantService";
import { replicacheInstance as rep } from "@/replicache/replicache";

// recup toutes les poules d'un PoolManager
export async function getPoulesByPoolManagerId(poolManagerId) {
  return await rep.query(async (tx) => {
    const allPoules = await tx.scan({ prefix: "poule/" }).entries().toArray();
    return allPoules
      .filter(([_, poule]) => poule.poolManagerId === poolManagerId)
      .map(([_, poule]) => poule);
  });
}

// verifie et rend la poule terminé si tout les matchs sont finis !
export async function checkAndCompletePool(poolId) {
  // recuperer les matchs de la poule
  const poolMatches = await getMatchesByPool(poolId);

  // verifier que tous les matchs ont un gagnant
  const allCompleted = poolMatches.every(match => match.idWinner !== null);
  if (!allCompleted) {
    return;
  }

  // recuperer la poule pour obtenir les participants et le poolManagerId
  const pool = await rep.query(async (tx) => await tx.get(`poule/${poolId}`));
  if (!pool) {
    return;
  }

  // recuperer le classement de la poule terminee
  const participants = pool.participants || [];
  const ranking = determinePoolRanking(participants, poolMatches);
  if (ranking.length === 0) {
    return;
  }

  // verif s'il y a plusieurs joueurs ex aequo en premiere position
  const topPlayers = ranking.filter(p => p.rank === 1);
  if (topPlayers.length > 1) {
    // creer des matchs entre chaque paire des joueurs ex aequo
    for (let i = 0; i < topPlayers.length; i++) {
      for (let j = i + 1; j < topPlayers.length; j++) {
        const matchId = crypto.randomUUID() + '%ADDITIONNAL-MATCH'; // id unique pour le match
        await matchService.createMatch({
          idMatch: matchId,
          idPool: poolId,
          idMatchType: 2, // id poule
          idPlayer1: topPlayers[i].participant.id,
          idPlayer2: topPlayers[j].participant.id,
          idPreviousMatch1: null,
          idPreviousMatch2: null,
          idWinner: null,
        });
      }
    }
    // ne pas fermer la poule tant que ces matchs de departage n'ont pas ete joues
    return;
  }

  // si le premier est unique, marquer la poule comme complete
  await rep.mutate.updatePool({ id: poolId, isComplete: true });

  // seuls les participants classés à la première place se qualifient.
  // on élimine donc tous ceux qui ne sont pas à la première place.
  ranking.forEach(async (p) => {
    if (p.rank !== 1) {
      await ParticipantService.eliminateParticipant(p.participant.id);
    }
  });

  // recuperer toutes les poules du poolManager pour determiner si c'est la poule finale
  const poolManagerId = pool.poolManagerId;
  const allPools = await getPoulesByPoolManagerId(poolManagerId);
  const isFinalPool = pool.label === "Poule Finale" || allPools.length === 1;

  if (isFinalPool) {
    // si c'est la poule finale, mettre a jour le gagnant de la categorie
    const topParticipant = ranking.find(p => p.rank === 1)?.participant;
    if (!topParticipant) {
      return;
    }

    const poolManager = await getPoolManagerById(poolManagerId);
    const categoryId = poolManager.categoryId;
    if (categoryId) {
      await rep.mutate.updateCategory({
        id: categoryId,
        idWinner: topParticipant.id
      });
    }
  } else {
    // si ce n'est pas la poule finale, envoyer le gagnant vers la poule finale
    const topParticipant = ranking.find(p => p.rank === 1)?.participant;
    if (!topParticipant) {
      return;
    }

    const finalPool = allPools.find(p => p.label === "Poule Finale");
    if (!finalPool) {
      return;
    }

    // mettre a jour la poule finale avec le nouveau participant
    await rep.mutate.updatePool({
      id: finalPool.id,
      participants: [...(finalPool.participants || []), topParticipant]
    });
  }
}


