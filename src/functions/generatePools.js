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
  } else if (total <= 12) {
    nbPools = 3;
  } else if (total <= 16) {
    nbPools = 4;
  } else if (total <= 25) {
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
  
    // si une seule poule, elle doit directement s'appeler "Poule Finale"
    const poolLabel = nbPools === 1 ? "Poule Finale" : `Poule ${i + 1}`;
  
    pools.push(buildPool(slice, poolLabel, qualifyingPositions));
  }
  

  console.log(nbPools);

  // si on a plusieurs poules, on genere une poule finale vide avec un libellé spécifique
  if (nbPools > 1) {
    const finalPool = buildPool([], "Poule Finale", []);
    pools.push(finalPool);
  }
console.log(pools)
  return { structure: pools };
}

// construit une poule avec ses participants, matchs et classement
function buildPool(participants, label, qualifyingPositions) {
  const matches = generateRoundRobinMatches(participants, label); // genere les matchs en round-robin

  return {
    label, // on utilise directement le libellé passé en paramètre
    participants,
    matches,
    isComplete: false,
    qualifyingPositions,
  };
}

// genere les matchs en round-robin avec un ordre equitable
function generateRoundRobinMatches(participants, label) {
  const matches = [];
  const n = participants.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        idMatch: `${label}_${participants[i].id}vs${participants[j].id}`,
        player1: participants[i],
        player2: participants[j],
        score1: null,
        score2: null,
        winner: null,
        keikoku1: 0,
        keikoku2: 0,
      });
    }
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
