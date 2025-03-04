import { rep } from "@/replicache/stores/Bracket/bracketStore";
import { roundService } from "@/replicache/services/Bracket/roundService";
import { matchService } from "@/replicache/services/matchService";
import { generateBracket } from "@/functions/generateBracket";

export const bracketService = {
  create: async (categoryId, participants) => {
    const idBracket = crypto.randomUUID();

    // generation du bracket avec la fonction centrale
    const generatedBracket = generateBracket(participants);

    // sauvegarde du bracket sans les rounds et matchs
    await rep.mutate.create({
      id: idBracket,
      categoryId,
    });

    // enregistrement des rounds et des matchs dans replicache
    for (const round of generatedBracket.structure) {
      const idRound = await roundService.create(idBracket, round.label); // cree un round

      for (const match of round.matches) {
        await matchService.create({
          idMatch: match.idMatch,
          idRound, // on assigne bien l'uuid
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
  },

  update: async (idBracket, updates) => {
    await rep.mutate.update({ idBracket, ...updates });
  },

  /**
   * supprime un bracket
   */
  delete: async (idBracket) => {
    await rep.mutate.delete({ idBracket });
  },
};
