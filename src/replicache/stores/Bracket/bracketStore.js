import { Replicache } from "replicache";
import { Bracket } from "@/replicache/models/Bracket/Bracket";

export const rep = new Replicache({
  name: "bracket",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    async create(tx, { id, categoryId }) {
      await tx.put(`bracket/${id}`, new Bracket(id, categoryId));
    },  

    async update(tx, { id, ...updates }) {
      const bracket = await tx.get(`bracket/${id}`);
      if (!bracket) return;
      const updatedBracket = { ...bracket, ...updates };
      await tx.put(`bracket/${id}`, updatedBracket);
    },

    async delete(tx, { id }) {
      await tx.del(`bracket/${id}`);
    }
  },
});

// recuup le bracket d'une catégorie
export async function getBracketByCategory(categoryId) {
  return await rep.query(async (tx) => {
    const allBrackets = await tx.scan({ prefix: "bracket/" }).entries().toArray(); // 🔥 Correction ici

    for (const [key, value] of allBrackets) {
      if (value.categoryId === categoryId) {
        return value; // retourne le bracket trouvé
      }
    }

    return null; // rien trouvé
  });
}

export async function getBracketById(bracketId) {
  return await rep.query(async (tx) => {
    return await tx.get(`bracket/${bracketId}`);
  });
}

