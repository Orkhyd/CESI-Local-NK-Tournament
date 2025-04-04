export class FictifMatch {
    constructor(
      idFictifMatch,
      player1 = {
        fullName: 'Joueur 1',
        nationalityId: 73, // france par défaut
        ippons: 0,
        keikokus: 0
      },
      player2 = {
        fullName: 'Joueur 2',
        nationalityId: 73, // france par défaut aussi
        ippons: 0,
        keikokus: 0
      },
      timer = {
        isRunning: false,
        currentTime: 180, // 3 minutes de temps ( 180 secondes )
        additionalTime: -1
      }
    ) {
      this.idFictifMatch = idFictifMatch;
      this.player1 = player1;
      this.player2 = player2;
      this.timer = timer;
      this.createdAt = new Date().toISOString();
    }
  }