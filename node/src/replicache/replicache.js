import { Replicache } from 'replicache';
import participantMutators from './mutators/participantMutators';
import tournamentMutators from './mutators/tournamentMutators';
import bracketMutators from './mutators/bracketMutators';
import categoryMutators from './mutators/categoryMutators';
import matchMutators from './mutators/matchMutators';
import poolManagerMutators from './mutators/poolManagerMutators';
import poolMutators from './mutators/poolMutators';
import roundMutators from './mutators/roundMutators';
import fictifMatchMutators from './mutators/fictifMatchMutators';

const mutators = {};

export let replicacheInstance = null;

export function registerMutators(newMutators) {
  Object.assign(mutators, newMutators);
}

export function setupMutators() {
  registerMutators(bracketMutators);
  registerMutators(categoryMutators);
  registerMutators(matchMutators);
  registerMutators(participantMutators);
  registerMutators(poolManagerMutators);
  registerMutators(poolMutators);
  registerMutators(roundMutators);
  registerMutators(tournamentMutators);
  registerMutators(fictifMatchMutators);
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


