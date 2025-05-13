import { replicacheInstance as rep } from "@/replicache/replicache";

export const fictifMatchStore = {
  getById: async (id) => {
    return await rep.query(async (tx) => {
      const match = await tx.get(`fictifMatch/${id}`);
      return match ? structuredClone(match) : null;
    });
  },

  getAll: async () => {
    return await rep.query(async (tx) => {
      const matches = [];
      for await (const [key, value] of tx.scan({ prefix: 'fictifMatch/' })) {
        matches.push(structuredClone(value));
      }
      return matches;
    });
  },

  subscribe: (id, callback) => {
    return rep.subscribe(
      async (tx) => {
        return await tx.get(`fictifMatch/${id}`);
      },
      {
        onData: (match) => {
          callback(structuredClone(match));
        },
      }
    );
  },
};