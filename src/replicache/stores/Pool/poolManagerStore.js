import { replicacheInstance as rep } from "@/replicache/replicache";

// recup un PoolManager par son categoryId
export async function getPoolManagerByCategory(categoryId) {
  // const rep = getReplicache();
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

// recup un PoolManager par son ID
export async function getPoolManagerById(poolManagerId) {
  // const rep = getReplicache();
  return await rep.query(async (tx) => {
    const poolManager = await tx.get(`poolManager/${poolManagerId}`);
    return poolManager ? poolManager : null;
  });
}

