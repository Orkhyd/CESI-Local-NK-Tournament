export function determinePoolRanking(participants, matches) {
  if (!participants || !matches) return [];

  console.log(participants, matches);

  // init des statistiques pour chaque participant
  const stats = {};
  participants.forEach(p => {
    stats[p.id] = {
      participant: p,
      mj: 0,  // matchs joués
      mt: 0,  // Matchs totaux programmés
      mg: 0,  // matchs gagnés
      mp: 0,  // Matchs perdus
      ip: 0,  // Ippons pour
      ic: 0,  // Ippons conttre
      di: 0,  // Différence d'Ippons (ip - ic)
      kc: 0,  // keikoku contre
      kp: 0,  // keikoku pour
      points: 0 // ptns (1 point par victoire)
    };
  });

  // calcul du nombre total de matchs programmés (mt)
  matches.forEach(match => {
    if (match.idPlayer1 && stats[match.idPlayer1]) {
      stats[match.idPlayer1].mt++;
    }
    if (match.idPlayer2 && stats[match.idPlayer2]) {
      stats[match.idPlayer2].mt++;
    }
  });

  // mise à jour des statistiques en fonction des matchs joués
  matches.forEach(match => {
    if (!match.idWinner) return; // ignorer les matchs non terminés

    const p1 = match.idPlayer1;
    const p2 = match.idPlayer2;

    if (stats[p1]) stats[p1].mj++;
    if (stats[p2]) stats[p2].mj++;

    if (match.idWinner === p1) {
      stats[p1].mg++;
      stats[p1].points += 1;
      stats[p2].mp++;
    } else if (match.idWinner === p2) {
      stats[p2].mg++;
      stats[p2].points += 1;
      stats[p1].mp++;
    }

    // majdes Ippons et Keikokus
    if (stats[p1]) {
      stats[p1].ip += match.ipponsPlayer1 || 0;
      stats[p1].ic += match.ipponsPlayer2 || 0;
      stats[p1].kc += match.keikokusPlayer2 || 0;
      stats[p1].kp += match.keikokusPlayer1 || 0;
    }
    if (stats[p2]) {
      stats[p2].ip += match.ipponsPlayer2 || 0;
      stats[p2].ic += match.ipponsPlayer1 || 0;
      stats[p2].kc += match.keikokusPlayer1 || 0;
      stats[p2].kp += match.keikokusPlayer2 || 0;
    }
  });

  //  différence d'Ippons (di = ip - ic)
  Object.keys(stats).forEach(id => {
    stats[id].di = stats[id].ip - stats[id].ic;
  });

  // conversion en tableau et tri par points, différence d'Ippons, puis matchs gagnés
  const standArr = Object.values(stats);
  standArr.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.di !== a.di) return b.di - a.di;
    if (b.mg !== a.mg) return b.mg - a.mg;
    return a.kp - b.kp; // Le joueur avec moins de kp (fautes) est mieux classé.
  });

  // fonction pour verif la confrontation directe entre deux joueurs
  function getDirectMatchResult(playerA, playerB, matches) {
    return matches.find(match =>
      (match.idPlayer1 === playerA.participant.id && match.idPlayer2 === playerB.participant.id) ||
      (match.idPlayer1 === playerB.participant.id && match.idPlayer2 === playerA.participant.id)
    );
  }

  // applique la logique de confrontation directe pour les égalités
  for (let i = 0; i < standArr.length - 1; i++) {
    const currentPlayer = standArr[i];
    const nextPlayer = standArr[i + 1];

    // verif si les deux joueurs sont à égalité
    if (
      currentPlayer.points === nextPlayer.points &&
      currentPlayer.di === nextPlayer.di &&
      currentPlayer.mg === nextPlayer.mg &&
      currentPlayer.kp === nextPlayer.kp
    ) {
      // verif s'ils ont joué l'un contre l'autre
      const directMatch = getDirectMatchResult(currentPlayer, nextPlayer, matches);

      if (directMatch && directMatch.idWinner) {
        // qi le deuxième joueur a gagné la confrontation directe, on les échange
        if (directMatch.idWinner === nextPlayer.participant.id) {
          [standArr[i], standArr[i + 1]] = [standArr[i + 1], standArr[i]];
        }
      }
    }
  }

  // calcul des positions de classement avec gestion des égalités
  for (let i = 0; i < standArr.length; i++) {
    if (i === 0) {
      standArr[i].rank = 1;
    } else {
      const prev = standArr[i - 1];
      const curr = standArr[i];
      // si les critères de classement sont identiques, on garde le même rang.
      if (curr.points === prev.points && curr.di === prev.di && curr.mg === prev.mg && curr.kp === prev.kp) {
        curr.rank = prev.rank;
      } else {
        curr.rank = i + 1;
      }
    }
  }
  
  
  console.log('classement', standArr)
  return standArr;
}