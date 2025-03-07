import { rep } from '../stores/participantStore';

export const ParticipantService = {
  // créa d un participant pr un tournoi
  create: async (tournamentId, data) => {
    const id = crypto.randomUUID();

    await rep.mutate.create({
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
  update: async (id, data) => await rep.mutate.update({ id, ...data }),
  
  // supp d un participant
  delete: async (id) => await rep.mutate.delete({ id }),

  updateCategory: async (participantId, categoryId) => {   
    if (!participantId) {
      throw new Error("❌ Erreur : l'ID du participant est introuvable !");
    }
    
    await rep.mutate.update({ id: participantId, categoryId });
  }
  
};