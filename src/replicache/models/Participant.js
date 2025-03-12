// class pr stocker les infos d un participant
export class Participant {
  // init d un participant avec ses infos
  constructor(id, tournamentId, firstName, lastName, birthDate, clubName, weight, nationalityId, genderId, gradeId) {
    this.id = id; // id unique du participant
    this.tournamentId = tournamentId; // id du tournoi associe
    this.firstName = firstName; // prenom du participant
    this.lastName = lastName; // nom de famille du participant
    this.birthDate = birthDate; // date de naissance
    this.clubName = clubName; // nom du club du participant
    this.weight = weight; // poids du participant
    this.nationalityId = nationalityId; // nationalite du participant
    this.genderId = genderId; // id du genre du participant
    this.gradeId = gradeId; // id du grade du participant
    this.categoryId = -1; // id de la categorie par defaut
    this.isEliminated = false;
  }
}