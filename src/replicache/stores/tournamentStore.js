import { getReplicache } from "../replicache";

export async function getTournaments() {
  const rep = getReplicache();

  return await rep.query(async tx => {
    const tournaments = [];
    for await (const value of tx.scan({ prefix: "tournament/" })) {
      if (!value || typeof value !== "object") {
        continue;
      }
      tournaments.push(value);
    }
    return tournaments;
  });
}






