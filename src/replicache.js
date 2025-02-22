import { Replicache } from "replicache";
import { generateBracket } from "./functions/generateBracket";

// initialisation de replicache avec une base de donnees locale
export const replicache = new Replicache({
  name: "tournament-db",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872", // cle pour usage local uniquement
  mutators: {
    
    // ajoute un participant a la base de donnees
    async addParticipant(tx, participant) {
      await tx.put(`participant/${participant.id}`, participant);
    },

    // ajoute un match a la base de donnees
    async addMatch(tx, match) {
      await tx.put(`match/${match.id}`, match);
    },

    // ajoute un round a la base de donnees
    async addRound(tx, round) {
      await tx.put(`round/${round.id}`, round);
    },

    // ajoute un bracket a la base de donnees
    async addBracket(tx, bracket) {
      await tx.put(`bracket/${bracket.id}`, bracket);
    },

    // met a jour un match specifique avec de nouvelles valeurs
    async updateMatch(tx, { matchId, updates }) {
      
      // recuperer le match existant
      const existingMatch = await tx.get(`match/${matchId}`);
      if (!existingMatch) {
        return; // arreter la mise a jour si le match n existe pas
      }

      // appliquer les mises a jour
      const updatedMatch = { ...existingMatch, ...updates };
      await tx.put(`match/${matchId}`, updatedMatch);

      // recuperer le bracket actuel pour mettre a jour les dependances
      const currentBracket = await tx.get("bracket/current");
      if (!currentBracket) {
        return; // arreter si aucun bracket n est trouve
      }

      // mettre a jour la structure du bracket avec le match modifie
      const updatedBracket = {
        ...currentBracket,
        structure: currentBracket.structure.map(round => ({
          ...round,
          matches: round.matches.map(match => (match.id === matchId ? updatedMatch : match)),
        })),
      };

      // propager le gagnant au match suivant si un gagnant est defini
      if (updates.winner) {
        for (let i = 0; i < updatedBracket.structure.length - 1; i++) {
          const currentRound = updatedBracket.structure[i];
          const nextRound = updatedBracket.structure[i + 1];

          // verifier si le match appartient au round actuel
          const matchInRound = currentRound.matches.find(match => match.id === matchId);
          if (!matchInRound) continue;

          // rechercher le match suivant qui depend du match actuel
          for (const nextMatch of nextRound.matches) {
            if (nextMatch.previousMatch1 === matchId || nextMatch.previousMatch2 === matchId) {

              // mettre a jour les joueurs en fonction du gagnant
              const updatedNextMatch = {
                ...nextMatch,
                player1: nextMatch.previousMatch1 === matchId ? updates.winner : nextMatch.player1,
                player2: nextMatch.previousMatch2 === matchId ? updates.winner : nextMatch.player2,
              };

              // verifier si un joueur existe deja pour eviter l ecrasement
              if (nextMatch.previousMatch1 !== matchId && nextMatch.player1?.id !== -2 && nextMatch.player1?.id !== -1) {
                updatedNextMatch.player1 = nextMatch.player1;
              }
              if (nextMatch.previousMatch2 !== matchId && nextMatch.player2?.id !== -2 && nextMatch.player2?.id !== -1) {
                updatedNextMatch.player2 = nextMatch.player2;
              }

              // sauvegarder le match suivant mis a jour
              await tx.put(`match/${nextMatch.id}`, updatedNextMatch);

              // mettre a jour la structure du bracket avec le match suivant modifie
              updatedBracket.structure = updatedBracket.structure.map(round => ({
                ...round,
                matches: round.matches.map(match => (match.id === nextMatch.id ? updatedNextMatch : match)),
              }));
            }
          }
        }
      }

      // sauvegarder le bracket mis a jour
      await tx.put("bracket/current", updatedBracket);
    },

    // cree un bracket en fonction des participants donnes
    async createBracket(tx, { participants }) {
      
      const bracketId = "current";
      const bracket = generateBracket(participants);

      // verification de l existence de la structure du bracket
      if (!bracket || !bracket.structure) {
        return; // arreter si la structure est invalide
      }

      await tx.put(`bracket/${bracketId}`, bracket);
      
      // sauvegarde des rounds et des matchs generes
      for (const round of bracket.structure) {
        await tx.put(`round/${round.label}`, round);
        for (const match of round.matches) {
          await tx.put(`match/${match.id}`, match);
        }
      }
    }
  }
});

// initialise des participants en dur pour les tests
async function addInitialParticipants() {
  const participants = [
    { id: 1, nom: "Dupont", prenom: "Jean" },
    { id: 2, nom: "Martin", prenom: "Sophie" },
    { id: 3, nom: "Bernard", prenom: "Luc" },
    { id: 4, nom: "Durand", prenom: "Emma" },
    { id: 5, nom: "Leroy", prenom: "Paul" },
    { id: 6, nom: "Moreau", prenom: "Julie" },
    { id: 7, nom: "Guerrin", prenom: "Florian" },
    { id: 8, nom: "Donah", prenom: "Hector" },
    { id: 9, nom: "Guit", prenom: "Thomas" }
  ];

  for (const participant of participants) {
    await replicache.mutate.addParticipant(participant);
  }
}

// execute l ajout des participants au lancement
addInitialParticipants().catch(console.error);
