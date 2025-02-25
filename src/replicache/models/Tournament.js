export class Tournament {
    constructor(id, name, startDate, started = false) {
      this.id = id;
      this.name = name;
      this.startDate = startDate;
      this.started = started;
    }
  }