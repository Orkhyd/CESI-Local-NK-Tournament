// generatePools.js
// Génère des poules de 3 à 6 combattants de façon équilibrée
// et indique dans chaque poule quelles positions se qualifient pour la phase suivante.

export function generatePools(participants) {
  const minPoolSize = 3;
  const maxPoolSize = 6;
  
  // Filtrer et mélanger les participants (on ignore ceux dont id === -1)
  const realParticipants = participants.filter((p) => p.id !== -1);
  shuffleArray(realParticipants);
  
  const total = realParticipants.length;
  if (total === 0) return { structure: [] };

  // Déterminer le nombre de poules en fonction du total (entre 3 et 36 participants)
  let nbPools;
  if (total <= 5) {
    nbPools = 1;
  } else if (total <= 8) {
    nbPools = 2;
  } else if (total <= 11) {
    nbPools = 3;
  } else if (total <= 14) {
    nbPools = 4;
  } else if (total <= 17) {
    nbPools = 5;
  } else {
    nbPools = 6;
  }
  
  // Répartition équilibrée :
  // On calcule q = floor(total / nbPools) et r = total mod nbPools.
  // Les r premières poules auront q+1 participants, les autres q.
  const pools = [];
  const q = Math.floor(total / nbPools);
  const r = total % nbPools;
  let startIndex = 0;
  
  // Pour chaque poule, on détermine aussi la position qualificative :
  // - Si on a plusieurs poules, seul le 1er (position 1) se qualifie.
  // - Sinon, aucune qualification n'est nécessaire (la poule finale détermine directement le classement).
  const qualifyingPositions = (nbPools > 1) ? [1] : [];

  for (let i = 0; i < nbPools; i++) {
    const poolSize = i < r ? q + 1 : q;
    const slice = realParticipants.slice(startIndex, startIndex + poolSize);
    startIndex += poolSize;
    pools.push(buildPool(slice, i + 1, qualifyingPositions));
  }
  
  console.log(pools)
  return { structure: pools };
}

function buildPool(participants, indexPool, qualifyingPositions) {
  const matches = [];
  // Création des matchs en round-robin : chaque combattant affronte tous les autres
  for (let j = 0; j < participants.length; j++) {
    for (let k = j + 1; k < participants.length; k++) {
      matches.push({
        idMatch: `P${indexPool}_${j + 1}vs${k + 1}`,
        player1: participants[j],
        player2: participants[k],
        score1: null,
        score2: null,
        winner: null,
        keikoku1: 0,
        keikoku2: 0,
      });
    }
  }
  
  const totalMatches = participants.length - 1;
  const standings = participants.map((p) => ({
    participant: p,
    mg: 0, // matchs gagnés
    mp: 0, // matchs perdus
    mj: 0, // matchs joués
    mt: totalMatches, // matchs théoriques
    ip: 0, // points inscrits
    ic: 0, // points encaissés
    di: 0, // différence de points
    kp: 0, // indicateur (ex : avertissements)
    kc: 0,
    points: 0,
  }));
  
  return {
    label: `Poule ${indexPool}`,
    participants,
    matches,
    standings,
    isComplete: false,
    // Indique quelles positions se qualifient pour la phase finale.
    // Pour plusieurs poules, seul le premier qualifie.
    qualifyingPositions
  };
}

function regeneratePoolData(pool, indexPool) {
  const parts = pool.participants;
  const newMatches = [];
  for (let j = 0; j < parts.length; j++) {
    for (let k = j + 1; k < parts.length; k++) {
      newMatches.push({
        idMatch: `P${indexPool}_${j + 1}vs${k + 1}`,
        player1: parts[j],
        player2: parts[k],
        score1: null,
        score2: null,
        winner: null,
        keikoku1: 0,
        keikoku2: 0,
      });
    }
  }
  pool.matches = newMatches;
  const totalMatches = parts.length - 1;
  pool.standings = parts.map((p) => ({
    participant: p,
    mg: 0,
    mp: 0,
    mj: 0,
    mt: totalMatches,
    ip: 0,
    ic: 0,
    di: 0,
    kp: 0,
    kc: 0,
    points: 0,
  }));
  pool.isComplete = false;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function updatePoolStandings(pool) {
  // Réinitialisation des statistiques
  pool.standings.forEach((s) => {
    s.mg = 0;
    s.mp = 0;
    s.mj = 0;
    s.ip = 0;
    s.ic = 0;
    s.di = 0;
    s.kp = 0;
    s.kc = 0;
    s.points = 0;
  });

  pool.matches.forEach((m) => {
    const { player1, player2, score1, score2, winner, keikoku1, keikoku2 } = m;
    if (!player1 || !player2) return;
    const standing1 = pool.standings.find((s) => s.participant.id === player1.id);
    const standing2 = pool.standings.find((s) => s.participant.id === player2.id);
    if (!standing1 || !standing2) return;

    // Un match est considéré comme joué si un gagnant est défini
    // ou si les deux scores sont renseignés.
    const matchPlayed = winner !== null || (score1 !== null && score2 !== null);
    if (matchPlayed) {
      const s1 = score1 || 0;
      const s2 = score2 || 0;
      standing1.mj++;
      standing2.mj++;
      standing1.ip += s1;
      standing1.ic += s2;
      standing2.ip += s2;
      standing2.ic += s1;
      standing1.kp += keikoku1;
      standing1.kc += keikoku2;
      standing2.kp += keikoku2;
      standing2.kc += keikoku1;

      if (winner === player1.id) {
        standing1.mg++;
        standing1.points++;
        standing2.mp++;
      } else if (winner === player2.id) {
        standing2.mg++;
        standing2.points++;
        standing1.mp++;
      }
    }
  });

  // Calcul de la différence et tri des standings
  pool.standings.forEach((s) => {
    s.di = s.ip - s.ic;
  });
  pool.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.di !== a.di) return b.di - a.di;
    return b.mg - a.mg;
  });

  pool.isComplete = pool.matches.every((m) => m.winner !== null);
  return pool;
}

// Génère la poule finale (phase des vainqueurs) en ne prenant que les premiers qualifiés
export function generateFinalistPool(pools) {
  const finalists = [];
  pools.forEach((pool) => {
    // Ici, on prend les positions indiquées dans pool.qualifyingPositions
    // Par défaut, cela correspond au premier de la poule (index 0)
    pool.qualifyingPositions.forEach((pos) => {
      // On considère que le classement est déjà trié (le premier est le meilleur)
      const qualified = pool.standings[pos - 1]; // conversion 1-indexé -> 0-indexé
      if (qualified) finalists.push(qualified.participant);
    });
  });
  // On regroupe les vainqueurs dans une nouvelle phase finale
  const finalResult = generatePools(finalists).structure;
  finalResult.forEach((fPool, idx) => {
    fPool.label = `Finale ${idx + 1}`;
    fPool.matches.forEach((match) => {
      if (match.idMatch.startsWith('P')) {
        match.idMatch = match.idMatch.replace(/^P/, 'F');
      }
    });
  });
  return finalResult;
}
