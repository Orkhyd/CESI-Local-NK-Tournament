import { Replicache } from "replicache";

export const rep = new Replicache({
  name: "pool",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872", 
  mutators: {
    // cree une poule
    async createPoule(tx, { id, poolManagerId, label, participants, qualifyingPositions }) {
      await tx.put(`poule/${id}`, { id, poolManagerId, label, participants, qualifyingPositions });
    },

    // met à jour une poule
    async updatePoule(tx, { id, ...updates }) {
      const poule = await tx.get(`poule/${id}`);
      if (!poule) return;
      const updatedPoule = { ...poule, ...updates };
      await tx.put(`poule/${id}`, updatedPoule);
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