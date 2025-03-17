export class PoolManager {
    constructor({ id, categoryId }) {
      this.id = id;
      this.categoryId = categoryId;
    }
  
    toJSON() {
      return {
        id: this.id,
        categoryId: this.categoryId,
      };
    }
  }
  