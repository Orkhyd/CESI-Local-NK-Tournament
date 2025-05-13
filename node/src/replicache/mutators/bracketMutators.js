import { Bracket } from "../models/Bracket/Bracket";


const bracketMutators = {
  createBracket: async (tx, { id, categoryId }) => {
    await tx.set(`bracket/${id}`, new Bracket(id, categoryId));
  },
  updateBracket: async (tx, { id, ...updates }) => {
    const bracket = await tx.get(`bracket/${id}`);
    if (!bracket) return;
    const updatedBracket = { ...bracket, ...updates };
    await tx.set(`bracket/${id}`, updatedBracket);
  },
  deleteBracket: async (tx, { id }) => {
    await tx.del(`bracket/${id}`);
  }
};


export default bracketMutators;
