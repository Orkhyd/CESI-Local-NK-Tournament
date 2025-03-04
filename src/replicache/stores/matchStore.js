import { Replicache } from "replicache";
import { Match } from "@/replicache/models/Match";

export const rep = new Replicache({
  name: "match",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    async create(tx, { idMatch, idMatchType, idRound, idPlayer1, idPlayer2, idPreviousMatch1, idPreviousMatch2, ipponsPlayer1, ipponsPlayer2, keikokusPlayer1, keikokusPlayer2, idWinner }) {
      await tx.put(`match/${idMatch}`, new Match(
        idMatch,
        idMatchType,
        idRound,
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
    }
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
