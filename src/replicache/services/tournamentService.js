import { rep } from '../stores/tournamentStore';

export const TournamentService = {
  create: (id, name, startDate) => rep.mutate.create({ id, name, startDate }),
  delete: (id) => rep.mutate.delete({ id }),
  start: (id) => rep.mutate.toggleState({ id, started: true })
};