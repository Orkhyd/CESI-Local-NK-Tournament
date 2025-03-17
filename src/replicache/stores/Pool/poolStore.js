import { Replicache } from "replicache";
import { Pool } from "@/replicache/models/Pool/Pool";
import { getMatchesByPool } from "@/replicache/stores/matchStore"
import { determinePoolRanking } from "@/functions/determinePoolRanking";

export const rep = new Replicache({
  name: "pool",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    // crée une poule
    async createPoule(tx, data) {
      const pool = new Pool(data);
      await tx.put(`poule/${pool.id}`, pool.toJSON());
    },

    // met à jour une poule
    async updatePoule(tx, { id, ...updates }) {
      const poule = await tx.get(`poule/${id}`);
      if (!poule) return;
      const updatedPool = new Pool({ ...poule, ...updates });
      await tx.put(`poule/${id}`, updatedPool.toJSON());
    },

    // supp une poule
    async deletePoule(tx, { id }) {
      await tx.del(`poule/${id}`);
    },
  },
});

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
  // recup les matchs de la poule
  const poolMatches = await getMatchesByPool(poolId);
  console.log("📌 Matchs de la poule :", poolMatches);

  // verif si tous les matchs ont un gagnant
  const allCompleted = poolMatches.every(match => match.idWinner !== null);

  if (!allCompleted) {
    return;
  }

  // meet à jour la poule comme complète
  await rep.mutate.updatePoule({ id: poolId, isComplete: true });

  // recup la poule pour obtenir le `poolManagerId`
  const poule = await rep.query(async (tx) => await tx.get(`poule/${poolId}`));
  if (!poule) {
    console.error("❌ Impossible de récupérer la poule !");
    return;
  }

  const poolManagerId = poule.poolManagerId;

  // recup toutes les poules de ce `poolManagerId`
  const allPoules = await getPoulesByPoolManagerId(poolManagerId);

  // cherche la poule finale
  const finalPool = allPoules.find(p => p.label === "Poule Finale");

  if (!finalPool) {
    console.warn("⚠️ Aucune poule finale trouvée !");
    return;
  }

  // recup le classement de la poule terminée
  const participants = poule.participants || [];
  const classement = determinePoolRanking(participants, poolMatches);

  if (classement.length === 0) {
    console.warn("⚠️ Aucun participant dans le classement !");
    return;
  }

  // recup le premier du classement
  const premierParticipant = classement[0].participant;

  const updatedFinalPool = { ...finalPool, participants: [...(finalPool.participants || []), premierParticipant] };

  // met à jour la poule finale avec le nouveau participant
  await rep.mutate.updatePoule({
    id: updatedFinalPool.id,
    participants: updatedFinalPool.participants
  });

  console.log(`✅ ${premierParticipant.lastName} ajouté à la Poule Finale !`);
}
