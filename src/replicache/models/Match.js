export class Match {
  constructor(
    idMatch,
    idMatchType, // type de match (tableau/pool)
    idRound = null, // uniquement en mode tableau
    idPlayer1,
    idPlayer2,
    idPreviousMatch1 = null, // uniquement en mode tableau
    idPreviousMatch2 = null, // uniquement en mode tableau
    ipponsPlayer1 = 0,
    ipponsPlayer2 = 0,
    keikokusPlayer1 = 0,
    keikokusPlayer2 = 0,
    idWinner = null
  ) {
    this.idMatch = idMatch;
    this.idMatchType = idMatchType;
    this.idRound = idRound;

    this.idPlayer1 = idPlayer1;
    this.idPlayer2 = idPlayer2;

    this.idPreviousMatch1 = idPreviousMatch1;
    this.idPreviousMatch2 = idPreviousMatch2;

    this.ipponsPlayer1 = ipponsPlayer1;
    this.ipponsPlayer2 = ipponsPlayer2;

    this.keikokusPlayer1 = keikokusPlayer1;
    this.keikokusPlayer2 = keikokusPlayer2;

    this.idWinner = idWinner;
  }
}
