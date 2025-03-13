import { Replicache } from "replicache";

export const rep = new Replicache({
  name: "poolManager",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    // crrée une instance de PoolManager
    async createPoolManager(tx, { id, categoryId }) {
      await tx.put(`poolManager/${id}`, { id, categoryId });
    },

    // met à jour une instance de PoolManager
    async updatePoolManager(tx, { id, ...updates }) {
      const poolManager = await tx.get(`poolManager/${id}`);
      if (!poolManager) return;
      const updatedPoolManager = { ...poolManager, ...updates };
      await tx.put(`poolManager/${id}`, updatedPoolManager);
    },

    // supp une instance de PoolManager
    async deletePoolManager(tx, { id }) {
      await tx.del(`poolManager/${id}`);
    },
  },
});

// recup un PoolManager par son categoryId
export async function getPoolManagerByCategory(categoryId) {
  return await rep.query(async (tx) => {
    const scanResults = await tx.scan({ prefix: 'poolManager/' }).entries().toArray();
    if (!Array.isArray(scanResults)) return null;
    for (const entry of scanResults) {
      if (!Array.isArray(entry) || entry.length < 2) continue;
      const poolManager = entry[1];
      if (poolManager && poolManager.categoryId === categoryId) {
        return poolManager;
      }
    }
    return null;
  });
}
