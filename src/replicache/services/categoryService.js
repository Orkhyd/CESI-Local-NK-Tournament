import { rep } from "@/replicache/stores/categoryStore";
import { ParticipantService } from "@/replicache/services/participantService"; 

export const CategoryService = {
  create: async (tournamentId, data) => {
    const categoryId = crypto.randomUUID(); // genere un id aleatoire
    const newCategory = {
      id: categoryId,
      tournamentId,
      name: data.name,
      genreId: data.genreId,
      typeId: data.typeId,
      ageCategoryIds: data.ageCategoryIds,
      minGradeId: data.minGradeId,
      maxGradeId: data.maxGradeId,
      participantIds: [],
    };
  
    await rep.mutate.create(newCategory);
  
    return newCategory; // retourne l'objet creer
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

  linkParticipants: async (categoryId, participantIds) => {
    await Promise.all(
      participantIds.map(async (participantId) => {
        await ParticipantService.updateCategory(participantId, categoryId);
      })
    );
  }
};
