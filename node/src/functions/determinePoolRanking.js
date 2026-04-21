/**
 * Classement Nippon Kempo : critères de départage dans l'ordre officiel :
 *  1. Points (victoire=2, nul=1, défaite=0)
 *  2. Résultat du match direct : UNIQUEMENT pour un groupe de 2 joueurs à égalité de points
 *  3. Différence d'ippons (ippons marqués − ippons reçus)
 *  4. Ippons marqués
 *  5. Keikokus reçus (moins = mieux)
 *  6. Égalité parfaite → match(s) supplémentaire(s) requis
 *
 * Chaque entrée retournée contient `tiebreakInfo` :
 *  null                              → pas de départage (points différents)
 *  { label, isEqual: false }         → départagé, ce joueur est devant le suivant grâce à ce critère
 *  { label, isEqual: true }          → égalité parfaite avec le suivant, même rang
 */
export function determinePoolRanking(participants, matches) {
  if (!participants || !matches) return [];

  const stats = {};
  participants.forEach(p => {
    stats[p.id] = {
      participant: p,
      mj: 0, mt: 0, mg: 0, mp: 0, mn: 0,
      ip: 0, ic: 0, di: 0, kp: 0, kc: 0,
      points: 0,
      tiebreakInfo: null,
    };
  });

  matches.forEach(match => {
    if (!stats[match.idPlayer1] || !stats[match.idPlayer2]) return;
    const p1 = match.idPlayer1;
    const p2 = match.idPlayer2;

    stats[p1].mt++;
    stats[p2].mt++;

    if (match.idWinner === undefined) return;

    stats[p1].mj++;
    stats[p2].mj++;

    if (match.idWinner === -1) {
      stats[p1].points += 1; stats[p2].points += 1;
      stats[p1].mn++;        stats[p2].mn++;
    } else if (match.idWinner !== null) {
      const winner = match.idWinner;
      const loser  = winner === p1 ? p2 : p1;
      stats[winner].points += 2; stats[winner].mg++;
      stats[loser].mp++;
    }

    stats[p1].ip += match.ipponsPlayer1 || 0;
    stats[p1].ic += match.ipponsPlayer2 || 0;
    stats[p1].kp += match.keikokusPlayer1 || 0;
    stats[p1].kc += match.keikokusPlayer2 || 0;

    stats[p2].ip += match.ipponsPlayer2 || 0;
    stats[p2].ic += match.ipponsPlayer1 || 0;
    stats[p2].kp += match.keikokusPlayer2 || 0;
    stats[p2].kc += match.keikokusPlayer1 || 0;
  });

  Object.values(stats).forEach(s => { s.di = s.ip - s.ic; });

  // Tri initial : Points → DI → Ippons marqués → Keikokus reçus
  const standArr = Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.di     !== a.di)     return b.di     - a.di;
    if (b.ip     !== a.ip)     return b.ip     - a.ip;
    if (a.kp     !== b.kp)     return a.kp     - b.kp;
    return 0;
  });

  // Identifier les groupes de joueurs à égalité de points
  const groups = [];
  let gStart = 0;
  for (let i = 1; i <= standArr.length; i++) {
    if (i === standArr.length || standArr[i].points !== standArr[gStart].points) {
      groups.push({ start: gStart, end: i });
      gStart = i;
    }
  }

  const findDirectMatch = (idA, idB) =>
    matches.find(m =>
      (m.idPlayer1 === idA && m.idPlayer2 === idB) ||
      (m.idPlayer1 === idB && m.idPlayer2 === idA)
    );

  const fmt  = (v) => (v > 0 ? '+' : '') + v;
  const name = (p) => `${p.participant.lastName} ${p.participant.firstName}`;

  // Traiter chaque groupe
  for (const { start, end } of groups) {
    const size = end - start;
    if (size === 1) continue;

    if (size === 2) {
      // ─── Groupe de 2 : match direct en priorité, puis DI/IP/KP ───
      const a = standArr[start];
      const b = standArr[start + 1];

      const dm = findDirectMatch(a.participant.id, b.participant.id);
      const dmWinner = dm && dm.idWinner !== null && dm.idWinner !== undefined && dm.idWinner !== -1
        ? dm.idWinner : null;

      if (dmWinner) {
        if (dmWinner !== a.participant.id) {
          standArr[start]     = b;
          standArr[start + 1] = a;
        }
        const winner = standArr[start];
        const loser  = standArr[start + 1];
        winner.tiebreakInfo = { label: `Devant ${name(loser)} : match direct gagné`, isEqual: false };
        loser.tiebreakInfo  = { label: `Derrière ${name(winner)} : match direct perdu`, isEqual: false };
      } else if (a.di !== b.di) {
        a.tiebreakInfo = { label: `Devant ${name(b)} : meilleure diff. d'ippons (${fmt(a.di)} vs ${fmt(b.di)})`, isEqual: false };
      } else if (a.ip !== b.ip) {
        a.tiebreakInfo = { label: `Devant ${name(b)} : plus d'ippons marqués (${a.ip} vs ${b.ip})`, isEqual: false };
      } else if (a.kp !== b.kp) {
        a.tiebreakInfo = { label: `Devant ${name(b)} : moins de pénalités reçues (${a.kp} vs ${b.kp})`, isEqual: false };
      } else {
        a.tiebreakInfo = { label: `Égalité avec ${name(b)} : match de départage requis`, isEqual: true };
        b.tiebreakInfo = { label: `Égalité avec ${name(a)} : match de départage requis`, isEqual: true };
      }

    } else {
      // ─── Groupe de 3+ : pas de match direct, uniquement DI/IP/KP ───
      for (let i = start; i < end - 1; i++) {
        const curr = standArr[i];
        const next = standArr[i + 1];
        if (curr.di !== next.di) {
          curr.tiebreakInfo = { label: `Devant ${name(next)} : meilleure diff. d'ippons (${fmt(curr.di)} vs ${fmt(next.di)})`, isEqual: false };
        } else if (curr.ip !== next.ip) {
          curr.tiebreakInfo = { label: `Devant ${name(next)} : plus d'ippons marqués (${curr.ip} vs ${next.ip})`, isEqual: false };
        } else if (curr.kp !== next.kp) {
          curr.tiebreakInfo = { label: `Devant ${name(next)} : moins de pénalités reçues (${curr.kp} vs ${next.kp})`, isEqual: false };
        } else {
          curr.tiebreakInfo = { label: `Égalité avec ${name(next)} : match(s) de départage requis`, isEqual: true };
          next.tiebreakInfo = { label: `Égalité avec ${name(curr)} : match(s) de départage requis`, isEqual: true };
        }
      }
    }
  }

  // Attribution des rangs
  standArr.forEach((p, index) => {
    if (index === 0) { p.rank = 1; return; }
    const prev = standArr[index - 1];
    if (prev.points !== p.points) {
      p.rank = index + 1;
    } else if (prev.tiebreakInfo?.isEqual) {
      p.rank = prev.rank; // vraie égalité → même rang
    } else {
      p.rank = index + 1; // départagé → rangs différents
    }
  });

  return standArr;
}
