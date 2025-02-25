import { rep } from "@/replicache/stores/categoryStore";

export const CategoryService = {
  create: async (id, tournamentId, data) => {
    console.log("📢 Création d'une catégorie :", { id, tournamentId, ...data });
    await rep.mutate.create({ id, tournamentId, ...data });
  },

  update: async (id, updates) => {
    await rep.mutate.update({ id, updates });
  },

  delete: async (id) => {
    await rep.mutate.delete({ id });
  },

  addParticipant: async (categoryId, participantId) => {
    await rep.mutate.linkParticipant({ categoryId, participantId });
  },
};
