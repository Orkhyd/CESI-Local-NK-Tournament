import { PoolManager } from "../models/Pool/PoolManager";

const poolManagerMutators = {
  // crée une instance de PoolManager
  createPoolManager: async (tx, data) => {
    const poolManager = new PoolManager(data);
    await tx.set(`poolManager/${poolManager.id}`, poolManager.toJSON());
  },

  // maj une instance de PoolManager
  updatePoolManager: async (tx, { id, ...updates }) => {
    const poolManager = await tx.get(`poolManager/${id}`);
    if (!poolManager) return;
    const updatedPoolManager = new PoolManager({ ...poolManager, ...updates });
    await tx.set(`poolManager/${id}`, updatedPoolManager.toJSON());
  },

  // supp une instance de PoolManager
  deletePoolManager: async (tx, { id }) => {
    await tx.del(`poolManager/${id}`);
  },
};

export default poolManagerMutators;
