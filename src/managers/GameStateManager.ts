// src/managers/GameStateManager.ts
import EventEmitter from 'events';



interface CharacterUpdate {
  characterId: number;
  position: { x: number; y: number };
}

class GameStateManager extends EventEmitter {
  updateCharacterState(update: CharacterUpdate) {
    this.emit('characterStateChanged', update);
  }
}

export default new GameStateManager();
