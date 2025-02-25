import { rep } from '../stores/participantStore';

export const ParticipantService = {
  // créa d un participant pr un tournoi
  create: (tournamentId, data) => rep.mutate.create({ tournamentId, ...data }),
  
  // modif des infos d un participant
  update: (id, data) => rep.mutate.update({ id, ...data }),
  
  // supp d un participant
  delete: (id) => rep.mutate.delete({ id })
};