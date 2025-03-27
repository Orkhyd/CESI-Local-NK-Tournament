import { PoolManager } from "../models/Pool/PoolManager";
import { registerMutators } from "../replicache";

const poolManagerMutators = {
  // crée une instance de PoolManager
  createPoolManager: async (tx, data) => {
    const poolManager = new PoolManager(data);
    await tx.put(`poolManager/${poolManager.id}`, poolManager.toJSON());
  },

  // maj une instance de PoolManager
  updatePoolManager: async (tx, { id, ...updates }) => {
    const poolManager = await tx.get(`poolManager/${id}`);
    if (!poolManager) return;
    const updatedPoolManager = new PoolManager({ ...poolManager, ...updates });
    await tx.put(`poolManager/${id}`, updatedPoolManager.toJSON());
  },

  // supp une instance de PoolManager
  deletePoolManager: async (tx, { id }) => {
    await tx.del(`poolManager/${id}`);
  },
};

registerMutators(poolManagerMutators);
export default poolManagerMutators;
