export function generateBracket(participants) {
  // filtrer les participants reels (supprimer les bye existants)
  const realParticipants = participants.filter(p => p.id !== -1);
  
  // determiner le nombre total de participants requis (puissance de 2 superieure ou egale)
  const totalPlayers = Math.pow(2, Math.ceil(Math.log2(realParticipants.length)));
  const byeCount = totalPlayers - realParticipants.length;
  
  // melanger aleatoirement les participants reels
  shuffleArray(realParticipants);
  
  // construire la liste des participants avec bye integres
  const allParticipants = [];
  let realIndex = 0;
  let byeInserted = 0;
  
  // repartir les bye de facon a eviter les matchs bye vs bye au premier tour
  while (realIndex < realParticipants.length || byeInserted < byeCount) {
      // alterner un vrai participant et un bye jusqu'a epuisement des bye
      if (realIndex < realParticipants.length) {
          allParticipants.push(realParticipants[realIndex]);
          realIndex++;
      }
      if (byeInserted < byeCount) {
          allParticipants.push({ id: -1, lastName: "BYE", fistName: "" });
          byeInserted++;
      }
  }
  
  // generer les tours
  const rounds = [];
  const roundLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // lettres pour l'id des tours
  let currentRoundParticipants = allParticipants;
  let roundNumber = 0;
  
  // libelles predefinis pour les tours
  const roundLabels = {
      1: "Finale",
      2: "1/2 finale",
      4: "1/4 de finale",
      8: "1/8 de finale",
      16: "1/16 de finale",
      32: "1/32 de finale",
      64: "1/64 de finale",
      128: "1/128 de finale",
      256: "1/256 de finale"
  };
  
  // creer chaque tour jusqu'a la finale
  while(currentRoundParticipants.length > 1) {
      const matches = [];
      const playersPerMatch = 2; // nombre de joueurs par match
      const matchCount = currentRoundParticipants.length / playersPerMatch;
      
      // creer les matchs du tour
      for(let i = 0; i < matchCount; i++) {
          // recuperer les joueurs pour ce match
          const player1 = currentRoundParticipants[i * 2];
          const player2 = currentRoundParticipants[i * 2 + 1];
          
          // generer l   id du match (ex: A1, B2, etc)
          const matchId = `${roundLetters[roundNumber]}${i + 1}`;
          
          // determiner les matchs precedents (pour les tours suivants)
          let previousMatch1 = null;
          let previousMatch2 = null;
          if (roundNumber > 0) {
              previousMatch1 = `${roundLetters[roundNumber - 1]}${i * 2 + 1}`;
              previousMatch2 = `${roundLetters[roundNumber - 1]}${i * 2 + 2}`;
          }

          // creation de l'objet match
          const match = {
              idMatch: matchId,
              previousMatch1: previousMatch1,
              previousMatch2: previousMatch2,
              player1: player1,
              player2: player2,
              score1: null,
              score2: null,
              winner: null,
              keikoku1: 0,
              keikoku2: 0
          };

          // regle speciale pour les bye : avancement automatique
          if (player1.id === -1 && player2.id !== -1) {
              match.winner = player2.id; // player2 gagne automatiquement
          } else if (player2.id === -1 && player1.id !== -1) {
              match.winner = player1.id; // player1 gagne automatiquement
          }

          matches.push(match);
      }
      
      // ajouter le tour avec ses matchs
      rounds.push({
          label: roundLabels[matchCount] || `Tour ${roundLetters[roundNumber]}`,
          matches: matches
      });
      
        // preparer les participants pour le prochain tour (les gagnants)
        // preparer les participants pour le prochain tour (les gagnants)
        currentRoundParticipants = matches.map(m => {
            // si le match a un gagnant défini (y compris un "bye"), on le passe directement
            if (m.winner) {
                return { id: m.winner, lastName: `*Gagnant de ${m.idMatch}` };
            }

            // sinon, on met un placeholder "gagnant en attente"
            return { id: -2, lastName: `*Gagnant de ${m.idMatch}` };
        });


        roundNumber++;

    }
    return {
      structure: rounds,
  };
  
  // fonction pour melanger un tableau
  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }
}