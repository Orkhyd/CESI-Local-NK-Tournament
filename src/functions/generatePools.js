// generatePools.js
// genere des poules de 3 a 6 combattants de facon equilibree
// et indique dans chaque poule quelles positions se qualifient pour la phase suivante

export function generatePools(participants) {
  const minPoolSize = 3;
  const maxPoolSize = 6;

  // filtre et melange les participants (on ignore ceux dont id === -1)
  const realParticipants = participants.filter((p) => p.id !== -1);
  shuffleArray(realParticipants);

  const total = realParticipants.length;
  if (total === 0) return { structure: [] };

  // determine le nombre de poules en fonction du total (entre 3 et 36 participants)
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

  // repartition equilibree :
  // on calcule q = floor(total / nbPools) et r = total mod nbPools
  // les r premieres poules auront q+1 participants, les autres q
  const pools = [];
  const q = Math.floor(total / nbPools);
  const r = total % nbPools;
  let startIndex = 0;

  // pour chaque poule, on determine aussi la position qualificative :
  // - si on a plusieurs poules, seul le 1er (position 1) se qualifie
  // - sinon, aucune qualification n'est necessaire (la poule finale determine directement le classement)
  const qualifyingPositions = nbPools > 1 ? [1] : [];

  for (let i = 0; i < nbPools; i++) {
    const poolSize = i < r ? q + 1 : q;
    const slice = realParticipants.slice(startIndex, startIndex + poolSize);
    startIndex += poolSize;
    pools.push(buildPool(slice, i + 1, qualifyingPositions));
  }

  console.log(pools);
  return { structure: pools };
}

// construit une poule avec ses participants, matchs et classement
function buildPool(participants, indexPool, qualifyingPositions) {
  const matches = generateRoundRobinMatches(participants, indexPool); // genere les matchs en round-robin

  const totalMatches = participants.length - 1;
  const standings = participants.map((p) => ({
    participant: p,
    mg: 0, // matchs gagnes
    mp: 0, // matchs perdus
    mj: 0, // matchs joues
    mt: totalMatches, // matchs theoriques
    ip: 0, // points inscrits
    ic: 0, // points encaisses
    di: 0, // difference de points
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
    // indique quelles positions se qualifient pour la phase finale
    // pour plusieurs poules, seul le premier qualifie
    qualifyingPositions,
  };
}

// genere les matchs en round-robin avec un ordre equitable
function generateRoundRobinMatches(participants, indexPool) {
  const matches = [];
  const n = participants.length;

  // si le nombre de participants est impair, on ajoute un participant fictif
  const hasDummy = n % 2 !== 0;
  const dummyParticipant = hasDummy ? { id: -1 } : null;
  const participantsWithDummy = hasDummy ? [...participants, dummyParticipant] : participants;

  // nombre de tours necessaires
  const rounds = n - 1;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const player1 = participantsWithDummy[i];
      const player2 = participantsWithDummy[n - 1 - i];

      // on ignore les matchs avec le participant fictif
      if (player1.id !== -1 && player2.id !== -1) {
        matches.push({
          idMatch: `P${indexPool}_${player1.id}vs${player2.id}_R${round + 1}`,
          player1,
          player2,
          score1: null,
          score2: null,
          winner: null,
          keikoku1: 0,
          keikoku2: 0,
        });
      }
    }

    // rotation des participants pour le prochain tour
    participantsWithDummy.splice(1, 0, participantsWithDummy.pop());
  }

  return matches;
}

// melange un tableau de facon aleatoire
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// genere la poule finale (phase des vainqueurs) en ne prenant que les premiers qualifies
export function generateFinalistPool(pools) {
  const finalists = [];
  pools.forEach((pool) => {
    // ici, on prend les positions indiquees dans pool.qualifyingPositions
    // par defaut, cela correspond au premier de la poule (index 0)
    pool.qualifyingPositions.forEach((pos) => {
      // on considere que le classement est deja trie (le premier est le meilleur)
      const qualified = pool.standings[pos - 1]; // conversion 1-indexe -> 0-indexe
      if (qualified) finalists.push(qualified.participant);
    });
  });

  // on regroupe les vainqueurs dans une nouvelle phase finale
  const finalResult = generatePools(finalists).structure;
  finalResult.forEach((fPool, idx) => {
    fPool.label = `Finale ${idx + 1}`;
    fPool.matches.forEach((match) => {
      if (match.idMatch.startsWith('P')) {
        match.idMatch = match.idMatch.replace(/^P/, 'F');
      }
    });
  });
  console.log(finalResult)
  return finalResult;
}