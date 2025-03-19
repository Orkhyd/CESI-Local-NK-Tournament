export class Category {
    constructor(id, tournamentId, name, genderId, typeId, ageCategoryIds, minGradeId, maxGradeId) {
      this.id = id;
      this.tournamentId = tournamentId;
      this.name = name;
      this.genderId = genderId;
      this.typeId = typeId;
      this.ageCategoryIds = ageCategoryIds;
      this.minGradeId = minGradeId;
      this.maxGradeId = maxGradeId;
      this.idWinner = null;
    }
  }