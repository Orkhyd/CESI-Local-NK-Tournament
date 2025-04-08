export class Tournament {
  constructor(id, name, address, startDate, started = false) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.startDate = startDate;
    this.started = started;
  }
}