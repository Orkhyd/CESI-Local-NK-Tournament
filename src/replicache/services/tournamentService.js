import { getReplicache } from "../replicache";

export const TournamentService = {
  createTournament: (id, name, startDate) => {

    const rep = getReplicache();
    rep.mutate.createTournament({ id, name, startDate });
  },

  deleteTournament: async (id) => {
    await deleteAllIndexedDB();
    location.reload(); // recharge la page pour tout réinitialiser
  },

  startTournament: (id) => {
    const rep = getReplicache();
    rep.mutate.toggleState({ id, started: true });
  }
};


export function deleteAllIndexedDB() {
  return new Promise((resolve, reject) => {
    const databases = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);

    databases.then((dbs) => {
      const deletePromises = dbs.map(db => new Promise((res, rej) => {
        if (db.name) {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => res();
          request.onerror = () => rej(`Erreur en supprimant la DB : ${db.name}`);
        } else {
          res();
        }
      }));

      Promise.all(deletePromises).then(resolve).catch(reject);
    }).catch(reject);
  });
}
