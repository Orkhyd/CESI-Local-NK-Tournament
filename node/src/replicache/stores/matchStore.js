// recup tous les matchs d'un bracket
import { replicacheInstance as rep } from "@/replicache/replicache";

// recupere tous les matchs d'un round specifique
export async function getMatchesByRound(idRound) {
  const matchPrefix = "match/";

  return await rep.query(async (tx) => {
    const matches = [];
    try {
      const scanOperation = tx.scan({ prefix: matchPrefix });
      const entriesOperation = await scanOperation.entries();
      const scanResultsArray = await entriesOperation.toArray();

      for (const entry of scanResultsArray) {
        if (!Array.isArray(entry) || entry.length < 2) {
          console.warn("Skipping malformed entry:", entry);
          continue;
        }

        const matchData = entry[1]; // Value is the second element

        if (
          typeof matchData === "object" &&
          matchData !== null &&
          matchData.idRound === idRound
        ) {
          matches.push(matchData);
        }
      }
    } catch (error) {
      console.error(
        `Error during scan/toArray with prefix "${matchPrefix}" for pool ${idRound}:`,
        error,
      );
      return [];
    }
    return matches;
  });
}

export async function getMatchesByPool(idPool) {
  const matchPrefix = "match/";

  return await rep.query(async (tx) => {
    const matches = [];
    try {
      const scanOperation = await tx.scan({ prefix: matchPrefix });
      const entriesOperation = await scanOperation.entries();
      const scanResultsArray = await entriesOperation.toArray();

      for (const entry of scanResultsArray) {
        if (!Array.isArray(entry) || entry.length < 2) {
          console.warn("Skipping malformed entry:", entry);
          continue;
        }

        const matchData = entry[1]; // Value is the second element

        if (
          typeof matchData === "object" &&
          matchData !== null &&
          matchData.idPool === idPool
        ) {
          matches.push(matchData);
        }
      }
    } catch (error) {
      console.error(
        `Error during scan/toArray with prefix "${matchPrefix}" for pool ${idPool}:`,
        error,
      );
      return [];
    }
    return matches;
  });
}


export async function getMatchById(idMatch) {
  return await rep.query(async (tx) => {
    return await tx.get(`match/${idMatch}`);
  });
}

export async function getMatchesByParticipant(participantId) {
  const matchPrefix = "match/";

  return await rep.query(async (tx) => {
    const matches = [];

    try {
      const scanOperation = tx.scan({ prefix: matchPrefix });
      const entriesOperation = await scanOperation.entries();
      const scanResultsArray = await entriesOperation.toArray();

      for (const entry of scanResultsArray) {
        if (!Array.isArray(entry) || entry.length < 2) {
          console.warn("Skipping malformed entry:", entry);
          continue;
        }

        const matchData = entry[1]; // Value is the second element

        // verif si le participant a joué dans ce match
        if (typeof matchData === "object" &&
          matchData !== null && (matchData.idPlayer1 === participantId || matchData.idPlayer2 === participantId)) {
          matches.push(matchData);
        }
      }

    } catch (error) {
      console.error(
        `Error during scan/toArray with prefix "${matchPrefix}" for pool ${idPool}:`,
        error,
      );
      return [];
    }
    return matches;
  });
}
