import { Replicache } from "replicache";
import { Round } from "@/replicache/models/Bracket/Round";

export const rep = new Replicache({
  name: "round",
  licenseKey: "l70ce33fc0dee46abb6f056086da4d872",
  mutators: {
    async create(tx, { id, idBracket, label }) {
      await tx.put(`round/${id}`, new Round(id, idBracket, label));
    },

    async update(tx, { id, ...updates }) {
      const round = await tx.get(`round/${id}`);
      if (!round) return;
      const updatedRound = { ...round, ...updates };
      await tx.put(`round/${id}`, updatedRound);
    },

    async delete(tx, { id }) {
      await tx.del(`round/${id}`);
    }
  },
});

// recup tous les rounds d'un bracket
export async function getRoundsByBracket(idBracket) {
  return await rep.query(async (tx) => {
    const rounds = [];
    for await (const value of tx.scan()) {
      if (value?.idBracket === idBracket) {
        rounds.push(value);
      }
    }
    return rounds;
  });
}
