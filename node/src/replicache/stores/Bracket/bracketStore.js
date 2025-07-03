import { replicacheInstance as rep } from "@/replicache/replicache";

// recuup le bracket d'une catégorie
export async function getBracketByCategory(categoryId) {
  return await rep.query(async (tx) => {
    const allBrackets = await tx.scan({ prefix: "bracket/" }).entries().toArray(); // 🔥 Correction ici

    for (const [_, value] of allBrackets) {
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
