export function determinePoolRanking(participants, matches) {
    if (!participants || !matches) return [];
  
    // init des statistiques pour chaque participant
    const stats = {};
    participants.forEach(p => {
      stats[p.id] = {
        participant: p,
        mj: 0,  // Matchs joués
        mt: 0,  // Matchs totaux programmés
        mg: 0,  // Matchs gagnés
        mp: 0,  // Matchs perdus
        ip: 0,  // Ippons pour
        ic: 0,  // Ippons contre
        di: 0,  // Différence d'Ippons (ip - ic)
        kc: 0,  // Keikoku contre
        kp: 0,  // Keikoku pour
        points: 0 // Points (1 point par victoire)
      };
    });
  
    // callcul du nombre total de matchs programmés (mt)
    matches.forEach(match => {
      if (match.idPlayer1 && stats[match.idPlayer1]) {
        stats[match.idPlayer1].mt++;
      }
      if (match.idPlayer2 && stats[match.idPlayer2]) {
        stats[match.idPlayer2].mt++;
      }
    });
  
    // maj des statistiquues en fonction des matchs joués
    matches.forEach(match => {
      if (!match.idWinner) return; // Iignorer les matchs non terminés
  
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
  
      // mis a jour des Ippons et Keikokus
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
  
    // clcul de la différence d'Ippons (di = ip - ic)
    Object.keys(stats).forEach(id => {
      stats[id].di = stats[id].ip - stats[id].ic;
    });
  
    // conversion en tableau et tri par points, différence d'Ippons, puis matchs gagnés
    const standArr = Object.values(stats);
    standArr.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.di !== a.di) return b.di - a.di;
      return b.mg - a.mg;
    });
  
    // verif des égalités et résolution avec les critères
    function resoudreEgalite(players) {
      while (players.length > 2) {
        // élimination par différence d'Ippons
        const minDiffIppons = Math.min(...players.map(p => p.di));
        players = players.filter(p => p.di > minDiffIppons);
        if (players.length <= 2) break;
  
        // elim par fautes commises (kc)
        const maxKeikokus = Math.max(...players.map(p => p.kc));
        players = players.filter(p => p.kc < maxKeikokus);
        if (players.length <= 2) break;
  
        // elim par nombre d'Ippons marqués (ip)
        const minIppons = Math.min(...players.map(p => p.ip));
        players = players.filter(p => p.ip > minIppons);
      }
      return players;
    }
  
    // appliquer la réduction aux joueurs ayant les mêmes points
    let finalStandings = [];
    let i = 0;
    while (i < standArr.length) {
      const currentPoints = standArr[i].points;
      const tiedPlayers = standArr.filter(p => p.points === currentPoints);
  
      if (tiedPlayers.length > 2) {
        const reducedPlayers = resoudreEgalite(tiedPlayers);
        finalStandings.push(...reducedPlayers);
        const eliminatedPlayers = tiedPlayers.filter(p => !reducedPlayers.includes(p));
        finalStandings.push(...eliminatedPlayers);
      } else {
        finalStandings.push(...tiedPlayers);
      }
  
      i += tiedPlayers.length;
    }
  
    // déterminer le premier et le deuxième en cas de confrontation directe
    if (finalStandings.length >= 2) {
      const [playerA, playerB] = finalStandings;
      const match = matches.find(m =>
        (m.idPlayer1 === playerA.participant.id && m.idPlayer2 === playerB.participant.id) ||
        (m.idPlayer1 === playerB.participant.id && m.idPlayer2 === playerA.participant.id)
      );
  
      if (match && match.idWinner) {
        if (match.idWinner === playerA.participant.id) {
          finalStandings[0] = playerA;
          finalStandings[1] = playerB;
        } else {
          finalStandings[0] = playerB;
          finalStandings[1] = playerA;
        }
      }
    }
  
    return finalStandings;
  }
  