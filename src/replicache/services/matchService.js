import { checkAndCompletePool } from "@/replicache/stores/Pool/poolStore";
import { getMatchById } from "@/replicache/stores/matchStore";
import { getMatchesByPool } from "@/replicache/stores/matchStore";
import { getRoundsByBracket, getRoundById } from "@/replicache/stores/Bracket/roundStore";
import { getBracketById } from "@/replicache/stores/Bracket/bracketStore";
import { getCategoryByBracketId } from "@/replicache/stores/categoryStore";
import { ParticipantService } from "@/replicache/services/participantService";
import { replicacheInstance as rep } from "@/replicache/replicache";

export const matchService = {
  createMatch: async (data) => {
    await rep.mutate.createMatch({ ...data });
  },

  updateMatch: async (idMatch, idMatchType, updates) => {
    await rep.mutate.updateMatch({ idMatch, ...updates });

    // en mode tableau et si ya un gagnant
    if (Number(idMatchType) === 2 && updates.idWinner) {

      const match = await getMatchById(idMatch);
      if (!match) return;

      const isFinalMatch = await checkIfFinalMatchBracket(match); // verifie si c'est le dernier match du tableau (finale )

      if (isFinalMatch) {
        await declareCategoryWinner(match, updates.idWinner); // declare le gagnant du match gagnant de la category
      } else {
        await propagateWinnerToNextBracketMatch(idMatch, updates.idWinner); // propage le gagnant au match d'apres

        const loserId = (match.idPlayer1 === updates.idWinner) ? match.idPlayer2 : match.idPlayer1; // identifie le perdant : si le joueur 1 est le gagnant, le perdant est le joueur 2, sinon inversement

        await ParticipantService.eliminateParticipant(loserId); // elimine immédiatement le perdant
        await propagateLoserToPetiteFinale(idMatch, loserId); // propage le perdant vers les petites finales (matchs PF-xxx)

      }
    }

    if (Number(idMatchType) === 1) {  // en mode poule on verifie si c'est lde dernier match et si oui on cloture la poule et envois le participant dans la poule finalek
      const match = await getMatchById(idMatch);
      if (match && match.idPool) {
        await checkAndCompletePool(match.idPool);
      }
    }
  },

  deleteMatch: async (idMatch) => {
    await rep.mutate.deleteMatch({ idMatch });
  },

  startTimer: async (idMatch) => {
    await rep.mutate.updateTimer({ idMatch, isRunning: true });
  },

  stopTimer: async (idMatch) => {
    await rep.mutate.updateTimer({ idMatch, isRunning: false });
  },

  resetTimer: async (idMatch) => {
    await rep.mutate.updateTimer({ idMatch, currentTime: 180, additionalTime: 0, isRunning: false });
  },

  addTime: async (idMatch, seconds) => {
    const match = await rep.query(async (tx) => await tx.get(`match/${idMatch}`));
    if (!match) return;

    const newTime = match.timer.currentTime + seconds;
    await rep.mutate.updateTimer({ idMatch, currentTime: newTime });
  },

  setAdditionalTime: async (idMatch, seconds) => {
    await rep.mutate.updateTimer({ idMatch, additionalTime: seconds });
  },

  generatePoolFinalMatchs: async (poolManagerId, finalPoolId, finalPoolParticipants, finalRoundId) => {

    // verif avec getMatchesByPool : existe-t-il déjà des matchs pour ce round finaal ???
    const existingMatches = await getMatchesByPool(finalPoolId);

    if (existingMatches.length > 0) {
      return; // pas de génération si des matchs existent déjà
    }

    // création des matchs pour la poule finale (Round Robin)
    const matches = [];

    for (let i = 0; i < finalPoolParticipants.length; i++) {
      for (let j = i + 1; j < finalPoolParticipants.length; j++) {
        const idMatch = crypto.randomUUID(); // génère un ID unique
        const match = {
          idMatch,
          idMatchType: 1,
          idPool: finalPoolId,
          idRound: finalRoundId,
          idPlayer1: finalPoolParticipants[i].id,
          idPlayer2: finalPoolParticipants[j].id,
          idPreviousMatch1: null,
          idPreviousMatch2: null,
          ipponsPlayer1: 0,
          ipponsPlayer2: 0,
          keikokusPlayer1: 0,
          keikokusPlayer2: 0,
          idWinner: null,
          timer: {
            isRunning: false,
            currentTime: 180,
            additionalTime: -1,
          },
        };
        matches.push(match);
      }
    }

    // denregistrement des matchs dans Replicache
    for (const match of matches) {
      await rep.mutate.createMatch(match);
    }
  }
};

/* met a jouur les matchs suivants en assignant le gagnant dans idPlayer1 ou idPlayer2  */
async function propagateWinnerToNextBracketMatch(idMatch, idWinner) {
  const allMatches = await rep.query(async (tx) => {
    const matches = [];
    for await (const value of tx.scan({ prefix: "match/" })) {
      matches.push(value);
    }
    return matches;
  });

  // trouve les matchs suivants qui dépendent du match gagné
  const matchesToUpdate = allMatches.filter(m =>
    (m.idPreviousMatch1 === idMatch || m.idPreviousMatch2 === idMatch)
  );

  for (const match of matchesToUpdate) {
    const updatedMatch = { ...match };

    if (updatedMatch.idPreviousMatch1 === idMatch) {
      updatedMatch.idPlayer1 = idWinner;
    }
    if (updatedMatch.idPreviousMatch2 === idMatch) {
      updatedMatch.idPlayer2 = idWinner;
    }

    // maj des matchs suivants dans replicache
    await rep.mutate.updateMatch({ idMatch: match.idMatch, ...updatedMatch });
  }
}

// envois les perdants de la demi finale vers la petite finale
async function propagateLoserToPetiteFinale(idMatch, idLoser) {
  const allMatches = await rep.query(async (tx) => {
    const matches = [];
    for await (const value of tx.scan({ prefix: "match/" })) {
      matches.push(value);
    }
    return matches;
  });

  // cherche les matchs PF qui ont ce match comme précédent
  const petiteFinaleMatch = allMatches.find(m =>
    m.idMatch.startsWith("PF-") &&
    (m.idPreviousMatch1 === idMatch || m.idPreviousMatch2 === idMatch)
  );

  if (!petiteFinaleMatch) return;

  const updatedMatch = { ...petiteFinaleMatch };

  if (updatedMatch.idPreviousMatch1 === idMatch) {
    updatedMatch.idPlayer1 = idLoser;
  }
  if (updatedMatch.idPreviousMatch2 === idMatch) {
    updatedMatch.idPlayer2 = idLoser;
  }

  await rep.mutate.updateMatch({ idMatch: updatedMatch.idMatch, ...updatedMatch });
}

async function checkIfFinalMatchBracket(match) {
  // recup tous les rounds de ce bracket
  const actualRound = await getRoundById(match.idRound);
  const rounds = await getRoundsByBracket(actualRound.idBracket);
  if (!rounds || rounds.length === 0) return false;

  // trouve le round du match actuel
  const currentRound = rounds.find(r => r.id === match.idRound);
  if (!currentRound) return false;

  // verif si ce match est une vraie finale (et non une petite finale)
  return currentRound.label.toLowerCase() === "finale & petite-finale" && !match.idMatch.startsWith("PF-");

}

async function declareCategoryWinner(match, idWinner) {
  // trouver la catégorie liée à ce bracket
  const actualRound = await getRoundById(match.idRound);
  const bracket = await getBracketById(actualRound.idBracket);
  const category = await getCategoryByBracketId(bracket.categoryId);

  if (!bracket) {
    console.error("❌ Impossible de trouver le bracket associé !");
    return;
  }

  // mettre à jour la catégorie avec le gagnant
  await rep.mutate.updateCategory({
    id: category.id,
    idWinner, // enregistre le gagnant
  });
}
