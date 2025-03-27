import { roundService } from "@/replicache/services/Bracket/roundService";
import { matchService } from "@/replicache/services/matchService";
import { generateBracket } from "@/functions/generateBracket";
import { getBracketByCategory } from "@/replicache/stores/Bracket/bracketStore";
import { Mutex } from 'async-mutex';
import { getReplicache } from "@/replicache/replicache";

const bracketCreationMutex = new Mutex();

export const bracketService = {
  createBracket: async (categoryId, participants) => {
    const rep = getReplicache();
    const release = await bracketCreationMutex.acquire(); // verrouillage
    try {
      const existingBracket = await getBracketByCategory(categoryId);
      if (existingBracket) return existingBracket.id; // arrêt si déjà créé

      const idBracket = crypto.randomUUID();

      // generation du bracket avec la fonction centrale
      const generatedBracket = generateBracket(participants);

      // sauvegarde du bracket sans les rounds et matchs
      await rep.mutate.createBracket({
        id: idBracket,
        categoryId,
      });

      // enregistrement des rounds et des matchs dans replicache
      for (const round of generatedBracket.structure) {
        const idRound = await roundService.createRound(idBracket, round.label, round.order); // cree un round

        for (const match of round.matches) {
          await matchService.createMatch({
            idMatch: match.idMatch,
            idRound, // on assigne bien l'uuid
            idPool: null,
            idMatchType: 1, // type tableau
            idPlayer1: match.player1 ? match.player1.id : -2,
            idPlayer2: match.player2 ? match.player2.id : -2,
            idPreviousMatch1: match.previousMatch1,
            idPreviousMatch2: match.previousMatch2,
            idWinner: match.winner,
          });
        }
      }

      return idBracket;
    } finally {
      release();
    }
  },

  updateBracket: async (idBracket, updates) => {
    const rep = getReplicache();

    await rep.mutate.updateBracket({ idBracket, ...updates });
  },

  /**
   * supprime un bracket
   */
  deleteBracket: async (idBracket) => {
    const rep = getReplicache();

    await rep.mutate.deleteBracket({ idBracket });
  },
};
