import { replicacheInstance as rep } from "@/replicache/replicache";

export const ParticipantService = {
  // créa d un participant pr un tournoi
  createParticipant: async (tournamentId, data) => {
    const id = crypto.randomUUID();
    await rep.mutate.createParticipant({
      id,
      tournamentId,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      clubName: data.clubName,
      weight: data.weight,
      nationalityId: data.nationalityId,
      genderId: data.genderId,
      gradeId: data.gradeId,
    });
  },

  // modif des infos d un participant
  updateParticipant: async (id, data) => {
    await rep.mutate.updateParticipant({ id, ...data });
  },

  // supp d un participant
  deleteParticipant: async (id) => {
    await rep.mutate.deleteParticipant({ id });
  },

  updateParticipantCategory: async (participantId, categoryId) => {
    if (!participantId) {
      throw new Error("❌ Erreur : l'ID du participant est introuvable !");
    }
    await rep.mutate.updateParticipant({ id: participantId, categoryId });
  },

  eliminateParticipant: async (idParticipant) => {
    await rep.mutate.eliminateParticipant({ id: idParticipant });
  }
};
