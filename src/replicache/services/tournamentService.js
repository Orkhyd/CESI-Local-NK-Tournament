import { replicacheInstance as rep } from "@/replicache/replicache";

export const TournamentService = {
  createTournament: (id, name, address, startDate) => {

    rep.mutate.createTournament({ id, name, address, startDate });
  },

  deleteTournament: async (id) => {
    await deleteAllIndexedDB();
    location.reload(); // recharge la page pour tout réinitialiser
  },

  startTournament: (id) => {
    rep.mutate.toggleState({ id, started: true });
  }
};


export function deleteAllIndexedDB() {
  return new Promise((resolve, reject) => {
    const databases = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);

    databases.then((dbs) => {
      const deletePromises = dbs.map(db => new Promise((res, rej) => {
        if (db.name && db.name !== "workbox-expiration") {
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
