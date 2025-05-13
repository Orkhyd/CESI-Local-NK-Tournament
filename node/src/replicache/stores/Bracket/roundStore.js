import { replicacheInstance as rep } from "@/replicache/replicache";

// recup tous les rounds d'un bracket
export async function getRoundsByBracket(idBracket) {
  return await rep.query(async (tx) => {
    const rounds = [];
    for await (const value of tx.scan({ prefix: "round/" })) {
      if (value?.idBracket === idBracket) {
        rounds.push(value);
      }
    }
    return rounds;
  });
}

// recup un round par son ID
export async function getRoundById(idRound) {
  return await rep.query(async (tx) => {
    return await tx.get(`round/${idRound}`);
  });
}
