const fictifMatchMutators = {
  createFictifMatch: async (tx, { id, data }) => {
    await tx.set(`fictifMatch/${id}`, {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    });
  },

  updateFictifMatch: async (tx, { id, updates }) => {
    const match = await tx.get(`fictifMatch/${id}`);
    if (!match) return;

    const merged = {
      ...match,
      ...updates,
      player1: { ...match.player1, ...updates.player1 },
      player2: { ...match.player2, ...updates.player2 },
      timer: { ...match.timer, ...updates.timer },
    };

    await tx.set(`fictifMatch/${id}`, merged);
  },

};

export default fictifMatchMutators;