export class Round {
    constructor(id, idBracket, label, order, matches = []) {
      this.id = id;
      this.idBracket = idBracket;
      this.label = label;
      this.order = order;
      this.matches = matches;
    }
  }