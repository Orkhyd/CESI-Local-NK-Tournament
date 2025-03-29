// recup tous les matchs d'un bracket
import { replicacheInstance as rep } from "@/replicache/replicache";

// recupere tous les matchs d'un round specifique
export async function getMatchesByRound(idRound) {

  return await rep.query(async (tx) => {
    const matches = [];
    const scanResults = await tx.scan({ prefix: "/match" }).entries().toArray(); // convertir en tableau

    if (!Array.isArray(scanResults)) {
      return [];
    }

    for (const entry of scanResults) {
      // chaque entry semble etre un tableau sous la forme cle, valeur, timestamp
      if (!Array.isArray(entry) || entry.length < 2) continue; // ignorer si mal forme

      const matchData = entry[1]; // recuperer l'objet match (2eme element)

      if (matchData?.idRound === idRound) {
        matches.push(matchData);
      }
    }
    return matches;
  });
}

export async function getMatchesByPool(idPool) {
  return await rep.query(async (tx) => {
    const matches = [];
    const scanResults = await tx.scan({ prefix: "/match" }).entries().toArray();

    if (!Array.isArray(scanResults)) {
      return [];
    }

    for (const entry of scanResults) {
      if (!Array.isArray(entry) || entry.length < 2) continue;

      const matchData = entry[1]; // recup l'objet match

      // on verif que l'objet match possède bien la propriété idPool et qu'elle correspond
      if (matchData && matchData.idPool === idPool) {
        matches.push(matchData);
      }
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
  return await rep.query(async (tx) => {
    const matches = [];
    const scanResults = await tx.scan({ prefix: "/match" }).entries().toArray();

    if (!Array.isArray(scanResults)) {
      return [];
    }

    for (const entry of scanResults) {
      if (!Array.isArray(entry) || entry.length < 2) continue; // Ignorer si mal formée

      const matchData = entry[1]; // Récupérer l'objet match

      // verif si le participant a joué dans ce match
      if (matchData && (matchData.idPlayer1 === participantId || matchData.idPlayer2 === participantId)) {
        matches.push(matchData);
      }
    }

    return matches;
  });
}
