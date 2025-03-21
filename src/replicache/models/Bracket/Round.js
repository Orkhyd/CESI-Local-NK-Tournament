export class Round {
    constructor(id, idBracket, label, order, matches = []) {
      this.id = id;
      this.idBracket = idBracket;
      this.label = label; // (ex: "Finale", "Demi-finale", etc.
      this.order = order; // ordre du round
      this.matches = matches; // liste des matchs du round
    }
  }