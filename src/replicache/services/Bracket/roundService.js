import { replicacheInstance as rep } from "@/replicache/replicache";

export const roundService = {
  createRound: async (idBracket, label, order) => {
    const idRound = crypto.randomUUID(); // 🔥 Correct UUID

    await rep.mutate.createRound({
      id: idRound,
      idBracket,
      label,
      order
    });
    return idRound;
  },

  updateRound: async (id, updates) => {
    await rep.mutate.updateRound({ id, ...updates });
  },

  deleteRound: async (id) => {
    await rep.mutate.deleteRound({ id });
  },
};
