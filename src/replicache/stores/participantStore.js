import { Replicache } from 'replicache';
import { Participant } from '../models';
import { toRaw } from 'vue';

export const rep = new Replicache({
  name: 'participant',
  licenseKey: 'l70ce33fc0dee46abb6f056086da4d872',
  mutators: {
    // créa d un nv participant avec un id unique
    create: async (tx, { id, tournamentId, ...data }) => {
      
      // conversion des donnees reactives en obj brut
      const rawData = toRaw(data);
      
      // enreg ds la bd avec les infos du participant
      await tx.put(`participant/${id}`, new Participant(
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
    update: async (tx, { id, ...updates }) => {  
      const p = await tx.get(`participant/${id}`);
    
      if (p) {
        const updatedParticipant = { ...p, ...updates };
    
        await tx.put(`participant/${id}`, updatedParticipant);
    
      } else {
        console.error("⚠️ Aucune entrée trouvée pour cet ID, mise à jour impossible !");
      }
    },
    
    
    // supp d un participant via son id
    delete: async (tx, { id }) => {
      await tx.del(`participant/${id}`);
    },

    updateCategory: async (participantId, categoryId) => {
      await rep.mutate.update({ id: participantId, categoryId });
    },

    // eliminer un participant
    eliminate: async (tx, { id }) => {
      const participant = await tx.get(`participant/${id}`);
      if (!participant) {
        console.error(`❌ Le participant ${id} n'a pas été trouvé !`);
        return;
      }

      await tx.put(`participant/${id}`, { ...participant, isEliminated: true });
    },
  }
});

// récup ts les participants pr un tournoi donne
export async function getParticipantsByTournament(tournamentId) {
  if (!rep) return [];

  return await rep.query(async tx => {
    const participants = [];

    // scan ts les participants enreg et filtre pr le tournoi donne
    for await (const value of tx.scan()) {
      if (value?.tournamentId === tournamentId) {
        participants.push(value);
      }
    }

    return participants;
  });
}

// recup tout les participants d une categorie
export async function getParticipantsByCategory(tournamentId, categoryId) {
  if (!rep) return [];

  return await rep.query(async tx => {
    const participants = [];

    // parcours de tous les participants stockeees dans Replicache
    for await (const value of tx.scan()) {
      // filtre des participants appartenant au tournoi et à la catego spécifiés
      if (value?.tournamentId === tournamentId && value?.categoryId === categoryId) {
        participants.push(value);
      }
    }
    return participants;
  });
}

// recup un participant par son id
export async function getParticipantById(id) {
  // verif que l'instance Replicache est prête
  if (!rep) return null;

  // recup le participant dans Replicache via sa clé
  return await rep.query(async (tx) => {
    return await tx.get(`participant/${id}`);
  });
}

