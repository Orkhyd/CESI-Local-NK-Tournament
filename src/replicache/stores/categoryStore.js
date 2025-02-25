import { Replicache } from "/node_modules/.vite/deps/replicache.js?v=602aba82";
import { Category } from "/src/replicache/models/index.js";

export const rep = new Replicache({
  name: 'category',
  licenseKey: 'l70ce33fc0dee46abb6f056086da4d872',
  mutators: {
    create: async (tx, { id, tournamentId, ...data }) => {
      await tx.put(`category/${id}`, new Category(id, tournamentId, ...data));
    },
    update: async (tx, { id, ...updates }) => {
      const c = await tx.get(`category/${id}`);
      if (c) await tx.put(`category/${id}`, { ...c, ...updates });
    },
    delete: async (tx, { id }) => {
      await tx.del(`category/${id}`);
    },
    linkParticipant: async (tx, { categoryId, participantId }) => {
      const c = await tx.get(`category/${categoryId}`);
      const p = await tx.get(`participant/${participantId}`);
      if (c && p) {
        await tx.put(`category/${categoryId}`, { 
          ...c, 
          participantIds: [...c.participantIds, participantId] 
        });
      }
    }
  }
});

export async function getCategoriesWithParticipants() {
  if (!rep) {
    console.error("Replicache n'est pas initialisé !");
    return [];
  }

  return await rep.query(async tx => {
    const categories = [];
    
    for await (const { key, value } of tx.scan({ prefix: "category/" })) {
      if (!value || typeof value !== "object") continue;

      // Recup des participants liés
      const participants = [];
      for (const participantId of value.participantIds) {
        const participant = await tx.get(`participant/${participantId}`);
        if (participant) {
          participants.push(participant);
        }
      }

      categories.push({ ...value, participants });
    }

    return categories;
  });
}
