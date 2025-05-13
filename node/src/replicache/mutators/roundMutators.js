import { Round } from "../models/Bracket/Round";

const roundMutators = {
  createRound: async (tx, { id, idBracket, label, order }) => {
    await tx.set(`round/${id}`, new Round(id, idBracket, label, order));
  },

  updateRound: async (tx, { id, ...updates }) => {
    const round = await tx.get(`round/${id}`);
    if (!round) return;
    const updatedRound = { ...round, ...updates };
    await tx.set(`round/${id}`, updatedRound);
  },

  deleteRound: async (tx, { id }) => {
    await tx.del(`round/${id}`);
  }
};

export default roundMutators;
