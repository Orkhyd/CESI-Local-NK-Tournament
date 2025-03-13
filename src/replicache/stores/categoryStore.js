import { Replicache } from "/node_modules/.vite/deps/replicache.js?v=602aba82";
import { Category } from "/src/replicache/models/index.js";

export const rep = new Replicache({
  name: "category",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    create: async (tx, { id, tournamentId, ...data }) => {
      await tx.put(`category/${id}`, new Category(
        id,
        tournamentId,
        data.name,
        data.genderId,
        data.typeId,
        data.ageCategoryIds,
        data.minGradeId,
        data.maxGradeId
      ));      
    },
    update: async (tx, { id, ...updates }) => {
      const c = await tx.get(`category/${id}`);
      if (!c) return;
    
      const updatedCategory = { ...c, ...updates, ...updates.updates };
      delete updatedCategory.updates;
    
      await tx.put(`category/${id}`, updatedCategory);
    },    
     
    delete: async (tx, { id }) => {
      await tx.del(`category/${id}`);
    },
  },
});

 // recup toutes les catégories d'un tournoi donné avec leurs participants
export async function getCategoriesByTournament(tournamentId) {
  if (!rep) return [];

  return await rep.query(async (tx) => {
    const categories = [];

    // scan tous les enregistrements et filtre uniquement ceux du tournoi
    for await (const value of tx.scan()) {
      if (value?.tournamentId === tournamentId) {
        categories.push(value);
      }
    }

    return categories;
  });
}
