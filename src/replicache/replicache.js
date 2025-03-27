import { Replicache } from 'replicache';

const mutators = {};

let replicacheInstance = null;

export function registerMutators(newMutators) {
  Object.assign(mutators, newMutators);

  if (replicacheInstance) {
    console.log('Registered new mutators:', Object.keys(newMutators));
  }
}

export function getReplicache() {
  return replicacheInstance;
}

export default {
  install: (app) => {
    const rep = new Replicache({
      name: 'replicache',
      licenseKey: import.meta.env.VITE_REPLICACHE_LICENSE_KEY,
      mutators,
    });

    replicacheInstance = rep;

    app.provide('replicache', rep);
  },
};
