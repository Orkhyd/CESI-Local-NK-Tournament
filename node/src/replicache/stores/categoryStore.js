import { replicacheInstance as rep } from "@/replicache/replicache";
export async function getCategoriesByTournament(tournamentId) {
  if (!rep) return [];

  return await rep.query(async (tx) => {
    const categories = [];

    // scan tous les enregistrements et filtre uniquement ceux du tournoi
    for await (const value of tx.scan({ prefix: "category/" })) {
      if (value?.tournamentId === tournamentId) {
        categories.push(value);
      }
    }

    return categories;
  });
}

export async function getCategoryByBracketId(bracketId) {
  return await rep.query(async (tx) => {
    const allCategories = await tx.scan({ prefix: "category/" }).entries().toArray();

    for (const [key, value] of allCategories) {
      if (value.id === bracketId) {
        return value;
      }
    }

    return null;
  });
}
