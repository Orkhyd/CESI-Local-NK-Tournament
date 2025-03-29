import { replicacheInstance as rep } from "@/replicache/replicache";

export const roundService = {
  createRound: async (idBracket, label, order) => {
    // const rep = getReplicache();
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
    // const rep = getReplicache();
    await rep.mutate.updateRound({ id, ...updates });
  },

  deleteRound: async (id) => {
    // const rep = getReplicache();
    await rep.mutate.deleteRound({ id });
  },
};
