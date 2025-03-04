export class Round {
    constructor(id, idBracket, label, matches = []) {
      this.id = id;
      this.idBracket = idBracket;
      this.label = label; // (ex: "Finale", "Demi-finale", etc.
      this.matches = matches; // liste des matchs du round
    }
  }