import { Pool } from "../models/Pool/Pool";

const poolMutators = {
  // crée une poule
  createPool: async (tx, data) => {
    const pool = new Pool(data);
    await tx.set(`poule/${pool.id}`, pool.toJSON());
  },

  // met à jour une poule
  updatePool: async (tx, { id, ...updates }) => {
    const poule = await tx.get(`poule/${id}`);
    if (!poule) return;
    const updatedPool = new Pool({ ...poule, ...updates });
    await tx.set(`poule/${id}`, updatedPool.toJSON());
  },

  // supp une poule
  deletePool: async (tx, { id }) => {
    await tx.del(`poule/${id}`);
  },
};

export default poolMutators;
