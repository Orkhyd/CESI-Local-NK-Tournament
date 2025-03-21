import { rep } from "@/replicache/stores/Bracket/roundStore";

export const roundService = {
  create: async (idBracket, label, order) => {
    const idRound = crypto.randomUUID(); // 🔥 Correct UUID

    await rep.mutate.create({
      id: idRound,
      idBracket,
      label,
      order
    });
    return idRound;
  },

  update: async (id, updates) => {
    await rep.mutate.update({ id, ...updates });
  },

  delete: async (id) => {
    await rep.mutate.delete({ id });
  },
};
