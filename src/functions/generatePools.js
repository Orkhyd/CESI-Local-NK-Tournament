// generatePools.js
// Génère des poules entre 3 et 6 joueurs et gère l'update des standings.

export function generatePools(participants) {
  const minPoolSize = 3
  const maxPoolSize = 6
  const realParticipants = participants.filter((p) => p.id !== -1)
  shuffleArray(realParticipants)

  const total = realParticipants.length
  if (total === 0) return { structure: [] }
  if (total <= maxPoolSize) return { structure: [buildPool(realParticipants, 1)] }

  let nbPools = Math.ceil(total / maxPoolSize)
  const pools = []
  let startIndex = 0

  for (let i = 0; i < nbPools; i++) {
    const remaining = total - startIndex
    const poolsLeft = nbPools - i
    let size = Math.ceil(remaining / poolsLeft)
    size = Math.min(size, maxPoolSize)
    size = Math.max(size, minPoolSize)
    if (size > remaining) size = remaining

    const slice = realParticipants.slice(startIndex, startIndex + size)
    startIndex += size
    pools.push(buildPool(slice, i + 1))
  }

  if (pools.length > 1) {
    const lastPool = pools[pools.length - 1]
    const prevPool = pools[pools.length - 2]
    if (lastPool.participants.length < minPoolSize) {
      while (
        prevPool.participants.length > minPoolSize &&
        lastPool.participants.length < minPoolSize
      ) {
        lastPool.participants.push(prevPool.participants.pop())
      }
      regeneratePoolData(prevPool, pools.length - 1)
      regeneratePoolData(lastPool, pools.length)
    }
  }
  return { structure: pools }
}

function buildPool(participants, indexPool) {
  const matches = []
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
      })
    }
  }
  const totalMatches = participants.length - 1
  const standings = participants.map((p) => ({
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
  }))
  return {
    label: `Poule ${indexPool}`,
    participants,
    matches,
    standings,
    isComplete: false,
  }
}

function regeneratePoolData(pool, indexPool) {
  const parts = pool.participants
  const newMatches = []
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
      })
    }
  }
  pool.matches = newMatches
  const totalMatches = parts.length - 1
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
  }))
  pool.isComplete = false
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

export function updatePoolStandings(pool) {
  pool.standings.forEach((s) => {
    s.mg = 0
    s.mp = 0
    s.mj = 0
    s.ip = 0
    s.ic = 0
    s.di = 0
    s.kp = 0
    s.kc = 0
    s.points = 0
  })

  pool.matches.forEach((m) => {
    const { player1, player2, score1, score2, winner, keikoku1, keikoku2 } = m
    if (!player1 || !player2) return
    const standing1 = pool.standings.find((s) => s.participant.id === player1.id)
    const standing2 = pool.standings.find((s) => s.participant.id === player2.id)
    if (!standing1 || !standing2) return

    // Considère un match "joué" si un vainqueur est défini
    // ou si les 2 scores sont présents.
    const matchPlayed = winner !== null || (score1 !== null && score2 !== null)
    if (matchPlayed) {
      const s1 = score1 || 0
      const s2 = score2 || 0
      standing1.mj++
      standing2.mj++
      standing1.ip += s1
      standing1.ic += s2
      standing2.ip += s2
      standing2.ic += s1
      standing1.kp += keikoku1
      standing1.kc += keikoku2
      standing2.kp += keikoku2
      standing2.kc += keikoku1

      if (winner === player1.id) {
        standing1.mg++
        standing1.points++
        standing2.mp++
      } else if (winner === player2.id) {
        standing2.mg++
        standing2.points++
        standing1.mp++
      }
    }
  })

  pool.standings.forEach((s) => {
    s.di = s.ip - s.ic
  })
  pool.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.di !== a.di) return b.di - a.di
    return b.mg - a.mg
  })

  pool.isComplete = pool.matches.every((m) => m.winner !== null)
  return pool
}

export function generateFinalistPool(pools, finalistsCount = 1) {
  const finalists = []
  pools.forEach((pool) => {
    const top = pool.standings.slice(0, finalistsCount)
    finalists.push(...top.map((s) => s.participant))
  })
  const finalResult = generatePools(finalists).structure
  finalResult.forEach((fPool, idx) => {
    fPool.label = `Finale ${idx + 1}`
    fPool.matches.forEach((match) => {
      if (match.idMatch.startsWith('P')) {
        match.idMatch = match.idMatch.replace(/^P/, 'F')
      }
    })
  })
  return finalResult
}
