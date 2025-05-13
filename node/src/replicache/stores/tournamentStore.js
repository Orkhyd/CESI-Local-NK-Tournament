import { replicacheInstance as rep } from "@/replicache/replicache";

export async function getTournaments() {

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






