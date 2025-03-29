import { replicacheInstance as rep } from "@/replicache/replicache";

// recup toutes les catégories d'un tournoi donné avec leurs participants
export async function getCategoriesByTournament(tournamentId) {
  // const rep = getReplicache();
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

export async function getCategoryByBracketId(bracketId) {
  // const rep = getReplicache();
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
