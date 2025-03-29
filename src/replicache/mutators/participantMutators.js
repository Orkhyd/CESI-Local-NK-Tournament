import { Participant } from '../models';
import { toRaw } from 'vue';
import { getReplicache, registerMutators } from '../replicache';

const participantMutators = {
  // créa d un nv participant avec un id unique
  createParticipant: async (tx, { id, tournamentId, ...data }) => {

    // conversion des donnees reactives en obj brut
    const rawData = toRaw(data);

    // enreg ds la bd avec les infos du participant
    await tx.set(`participant/${id}`, new Participant(
      id,
      tournamentId,
      rawData.firstName,
      rawData.lastName,
      rawData.birthDate,
      rawData.clubName,
      rawData.weight,
      rawData.nationalityId,
      rawData.genderId,
      rawData.gradeId
    ));
  },

  // maj des infos d un participant si il existe
  updateParticipant: async (tx, { id, ...updates }) => {
    const p = await tx.get(`participant/${id}`);

    if (p) {
      const updatedParticipant = { ...p, ...updates };

      await tx.set(`participant/${id}`, updatedParticipant);

    } else {
      console.error("⚠️ Aucune entrée trouvée pour cet ID, mise à jour impossible !");
    }
  },


  // supp d un participant via son id
  deleteParticipant: async (tx, { id }) => {
    await tx.del(`participant/${id}`);
  },

  updateParticipantCategory: async (participantId, categoryId) => {
    const rep = getReplicache();
    await rep.mutate.updateParticipant({ id: participantId, categoryId });
  },

  // eliminer un participant
  eliminateParticipant: async (tx, { id }) => {
    const participant = await tx.get(`participant/${id}`);
    if (!participant) {
      console.error(`❌ Le participant ${id} n'a pas été trouvé !`);
      return;
    }

    await tx.set(`participant/${id}`, { ...participant, isEliminated: true });
  },
};
registerMutators(participantMutators);
export default participantMutators;
