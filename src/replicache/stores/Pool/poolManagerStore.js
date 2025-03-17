import { Replicache } from "replicache";
import { PoolManager } from "@/replicache/models/Pool/PoolManager";

export const rep = new Replicache({
  name: "poolManager",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
     // crée une instance de PoolManager
     async createPoolManager(tx, data) {
      const poolManager = new PoolManager(data);
      await tx.put(`poolManager/${poolManager.id}`, poolManager.toJSON());
    },

    // maj une instance de PoolManager
    async updatePoolManager(tx, { id, ...updates }) {
      const poolManager = await tx.get(`poolManager/${id}`);
      if (!poolManager) return;
      const updatedPoolManager = new PoolManager({ ...poolManager, ...updates });
      await tx.put(`poolManager/${id}`, updatedPoolManager.toJSON());
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
