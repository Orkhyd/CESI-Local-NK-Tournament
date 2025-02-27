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
        rawData.nationality,
        rawData.genderId,
        rawData.gradeId
      ));
    },    
    
    // maj des infos d un participant si il existe
    update: async (tx, { id, ...updates }) => {
      console.log("🛠️ Mise à jour demandée pour le participant :", id);
      console.log("📌 Données reçues pour mise à jour :", updates);
    
      const p = await tx.get(`participant/${id}`);
      console.log("🔍 Participant actuel avant mise à jour :", p);
    
      if (p) {
        const updatedParticipant = { ...p, ...updates };
        console.log("✅ Nouvelle version du participant après mise à jour :", updatedParticipant);
    
        await tx.put(`participant/${id}`, updatedParticipant);
    
        // 🔥 Vérifie immédiatement si les nouvelles valeurs sont bien stockées
        const checkUpdate = await tx.get(`participant/${id}`);
        console.log("🔎 Vérification après stockage :", checkUpdate);
      } else {
        console.log("⚠️ Aucune entrée trouvée pour cet ID, mise à jour impossible !");
      }
    },
    
    
    // supp d un participant via son id
    delete: async (tx, { id }) => {
      await tx.del(`participant/${id}`);
    },

    updateCategory: async (participantId, categoryId) => {
      console.log("🔄 Mise à jour du participant :", participantId, "avec la catégorie :", categoryId);
      await rep.mutate.update({ id: participantId, categoryId });
    }
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
