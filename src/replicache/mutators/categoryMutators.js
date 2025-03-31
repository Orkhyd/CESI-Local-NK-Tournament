import { Category } from '/src/replicache/models/index.js';

const categoryMutators = {
  createCategory: async (tx, { id, tournamentId, ...data }) => {

    await tx.set(
      `category/${id}`,
      new Category(
        id,
        tournamentId,
        data.name,
        data.genderId,
        data.typeId,
        data.ageCategoryIds,
        data.minGradeId,
        data.maxGradeId,
      ),
    );
  },

  updateCategory: async (tx, { id, ...updates }) => {
    const c = await tx.get(`category/${id}`);
    if (!c) return;

    const updatedCategory = {
      ...c,
      ...updates,
      ...(updates.updates ?? {}),
      idWinner: updates.idWinner ?? updates.updates?.idWinner ?? c.idWinner,
    };

    await tx.set(`category/${id}`, updatedCategory);
  },

  deleteCategory: async (tx, { id }) => {
    await tx.del(`category/${id}`);
  },
};

export default categoryMutators;
