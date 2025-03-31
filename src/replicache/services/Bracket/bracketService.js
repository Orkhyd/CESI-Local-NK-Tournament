import { roundService } from "@/replicache/services/Bracket/roundService";
import { matchService } from "@/replicache/services/matchService";
import { generateBracket } from "@/functions/generateBracket";
import { getBracketByCategory } from "@/replicache/stores/Bracket/bracketStore";
import { Mutex } from 'async-mutex';
import { replicacheInstance as rep } from "@/replicache/replicache";

const bracketCreationMutex = new Mutex();

export const bracketService = {
  createBracket: async (categoryId, participants) => {
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


      await Promise.all(generatedBracket.structure.map(async (round) => {
        // on cree une instance de round avec le service
        const idRound = await roundService.createRound(idBracket, round.label, round.order);

        // on cree les matchs de chaque round
        await Promise.all(round.matches.map(match =>
          matchService.createMatch({
            idMatch: match.idMatch,
            idRound, // on assigne bien l'uuid
            idPool: null,
            idMatchType: 1, // type tableau
            idPlayer1: match.player1 ? match.player1.id : -2,
            idPlayer2: match.player2 ? match.player2.id : -2,
            idPreviousMatch1: match.previousMatch1,
            idPreviousMatch2: match.previousMatch2,
            idWinner: match.winner,
          })
        ));
      }));

      return idBracket;
    } finally {
      release();
    }
  },

  updateBracket: async (idBracket, updates) => {

    await rep.mutate.updateBracket({ idBracket, ...updates });
  },

  /**
   * supprime un bracket
   */
  deleteBracket: async (idBracket) => {

    await rep.mutate.deleteBracket({ idBracket });
  },
};
