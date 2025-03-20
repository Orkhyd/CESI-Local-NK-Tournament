export function determinePoolRanking(participants, matches) {
  if (!participants || !matches) return [];
  console.log(participants, matches);

  // initialisation des statistiques pour chaque participant
  const stats = {};
  participants.forEach(p => {
    stats[p.id] = {
      participant: p,
      mj: 0,   // matchs joues
      mt: 0,   // matchs totaux programmes
      mg: 0,   // matchs gagnes
      mp: 0,   // matchs perdus
      mn: 0,   // matchs nuls
      ip: 0,   // ippons pour
      ic: 0,   // ippons contre
      di: 0,   // difference dippons
      kp: 0,   // keikoku pour
      kc: 0,   // keikoku contre
      points: 0 // points (2 pour victoire, 1 pour nul)
    };
  });

  // calcul des matchs programmes et des resultats
  matches.forEach(match => {
    // mise a jour des matchs programmes
    if (match.idPlayer1) stats[match.idPlayer1].mt++;
    if (match.idPlayer2) stats[match.idPlayer2].mt++;

    // on traite uniquement les matchs avec resultat
    if (match.idWinner === undefined) return;

    const p1 = match.idPlayer1;
    const p2 = match.idPlayer2;

    // mise a jour des matchs joues
    stats[p1].mj++;
    stats[p2].mj++;

    // gestion des points et resultats
    if (match.idWinner === -1) {
      // match nul
      stats[p1].points += 1;
      stats[p2].points += 1;
      stats[p1].mn++;
      stats[p2].mn++;
    } else if (match.idWinner !== null) {
      // victoire d un joueur
      const winner = match.idWinner;
      const loser = winner === p1 ? p2 : p1;
      stats[winner].points += 2;
      stats[winner].mg++;
      stats[loser].mp++;
    }

    // mise a jour des ippons et keikoku
    stats[p1].ip += match.ipponsPlayer1 || 0;
    stats[p1].ic += match.ipponsPlayer2 || 0;
    stats[p1].kp += match.keikokusPlayer1 || 0;
    stats[p1].kc += match.keikokusPlayer2 || 0;

    stats[p2].ip += match.ipponsPlayer2 || 0;
    stats[p2].ic += match.ipponsPlayer1 || 0;
    stats[p2].kp += match.keikokusPlayer2 || 0;
    stats[p2].kc += match.keikokusPlayer1 || 0;
  });

  // calcul de la difference dippons
  Object.values(stats).forEach(s => {
    s.di = s.ip - s.ic;
  });

  // tri initial sur les statistiques principales : 
  // points decroissant, difference dippons decroissante,
  // matchs gagnes decroissant, keikoku pour croissant
  const standArr = Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.di !== a.di) return b.di - a.di;
    if (b.mg !== a.mg) return b.mg - a.mg;
    if (a.kp !== b.kp) return a.kp - b.kp;
    return 0;
  });

  // fonction pour verifier l egalite des statistiques principales
  const areStatsEqual = (a, b) => (
    a.points === b.points &&
    a.di === b.di &&
    a.mg === b.mg &&
    a.kp === b.kp
  );

  // parcours du tableau trie pour traiter les groupes d egalite
  // si le groupe contient exactement 2 participants, on compare le match direct
  let groupStart = 0;
  for (let i = 1; i <= standArr.length; i++) {
    if (i === standArr.length || !areStatsEqual(standArr[i], standArr[groupStart])) {
      const groupSize = i - groupStart;
      if (groupSize === 2) {
        const playerA = standArr[groupStart];
        const playerB = standArr[groupStart + 1];
        const directMatch = matches.find(m =>
          (m.idPlayer1 === playerA.participant.id && m.idPlayer2 === playerB.participant.id) ||
          (m.idPlayer1 === playerB.participant.id && m.idPlayer2 === playerA.participant.id)
        );
        if (directMatch && directMatch.idWinner !== undefined && directMatch.idWinner !== -1) {
          // si le vainqueur direct est playerb, on echange leur ordre
          if (directMatch.idWinner === playerB.participant.id) {
            [standArr[groupStart], standArr[groupStart + 1]] = [standArr[groupStart + 1], standArr[groupStart]];
          }
        }
      }
      groupStart = i;
    }
  }

  // attribution finale des rangs
  standArr.forEach((p, index) => {
    if (index === 0) {
      p.rank = 1;
    } else {
      const prev = standArr[index - 1];
      // si les stats principales sont identiques, on garde le meme rang
      p.rank = areStatsEqual(p, prev) ? prev.rank : index + 1;
    }
  });

  return standArr;
}
