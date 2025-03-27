import { Round } from "../models/Bracket/Round";

const { registerMutators } = require("../replicache");

const roundMutators = {
  createMutators: async (tx, { id, idBracket, label, order }) => {
    await tx.put(`round/${id}`, new Round(id, idBracket, label, order));
  },

  updateMutators: async (tx, { id, ...updates }) => {
    const round = await tx.get(`round/${id}`);
    if (!round) return;
    const updatedRound = { ...round, ...updates };
    await tx.put(`round/${id}`, updatedRound);
  },

  deleteMutators: async (tx, { id }) => {
    await tx.del(`round/${id}`);
  }
};

registerMutators(roundMutators);
export default roundMutators;
