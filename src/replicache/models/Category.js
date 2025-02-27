export class Category {
    constructor(id, tournamentId, name, genreId, typeId, ageCategoryIds, minGradeId, maxGradeId) {
      this.id = id;
      this.tournamentId = tournamentId;
      this.name = name;
      this.genreId = genreId;
      this.typeId = typeId;
      this.ageCategoryIds = ageCategoryIds;
      this.minGradeId = minGradeId;
      this.maxGradeId = maxGradeId;
    }
  }