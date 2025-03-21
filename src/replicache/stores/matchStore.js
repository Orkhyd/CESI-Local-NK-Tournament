import { Replicache } from "replicache";
import { Match } from "@/replicache/models/Match";
import { ParticipantService } from "@/replicache/services/participantService";

export const rep = new Replicache({
  name: "match",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    async create(tx, { idMatch, idMatchType, idRound, idPool, idPlayer1, idPlayer2, idPreviousMatch1, idPreviousMatch2, ipponsPlayer1, ipponsPlayer2, keikokusPlayer1, keikokusPlayer2, idWinner }) {
      await tx.put(`match/${idMatch}`, new Match(
        idMatch,
        idMatchType,
        idRound,
        idPool,
        idPlayer1,
        idPlayer2,
        idPreviousMatch1,
        idPreviousMatch2,
        ipponsPlayer1 || 0,
        ipponsPlayer2 || 0,
        keikokusPlayer1 || 0,
        keikokusPlayer2 || 0,
        idWinner || null,
      ));
    },

    async update(tx, { idMatch, ...updates }) {
      const match = await tx.get(`match/${idMatch}`);
      if (!match) return;

      const updatedMatch = {
        ...match,
        ...updates,
        idWinner: updates.idWinner ?? match.idWinner,
      };

      await tx.put(`match/${idMatch}`, updatedMatch);
    },

    async delete(tx, { idMatch }) {
      await tx.del(`match/${idMatch}`);
    },

    async updateTimer(tx, { idMatch, isRunning, currentTime, additionalTime }) {
      const match = await tx.get(`match/${idMatch}`);
      if (!match) return;

      const updatedMatch = {
        ...match,
        timer: {
          ...match.timer,
          isRunning: isRunning ?? match.timer.isRunning,
          currentTime: currentTime ?? match.timer.currentTime,
          additionalTime: additionalTime ?? match.timer.additionalTime,
        },
      };

      await tx.put(`match/${idMatch}`, updatedMatch);
    },
  },
});

// recup tous les matchs d'un bracket
// recupere tous les matchs d'un round specifique
export async function getMatchesByRound(idRound) {
  return await rep.query(async (tx) => {
    const matches = [];
    const scanResults = await tx.scan().entries().toArray(); // convertir en tableau

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
    const scanResults = await tx.scan().entries().toArray();

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
    const scanResults = await tx.scan().entries().toArray(); 

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
