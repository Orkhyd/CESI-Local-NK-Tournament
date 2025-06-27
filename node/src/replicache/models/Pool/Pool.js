export class Pool {
    constructor({ id, poolManagerId, label, qualifyingPositions = [], isComplete = false, participants }) {
      this.id = id;
      this.poolManagerId = poolManagerId;
      this.label = label;
      this.qualifyingPositions = qualifyingPositions;
      this.isComplete = isComplete;
      this.participants = participants;
    }
  
    toJSON() {
      return {
        id: this.id,
        poolManagerId: this.poolManagerId,
        label: this.label,
        qualifyingPositions: this.qualifyingPositions,
        isComplete: this.isComplete,
        participants: this.participants
      };
    }
  }
  