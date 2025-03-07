// src/managers/GameStateManager.ts
import EventEmitter from 'events';

export interface BlockConquestStartedEvent {
  eventName: string;
  blockNumber: string; // número del bloque en el que ocurrió el evento
  transactionHash: string;
  args: {
    blockId: string;         // la posición (blockId) del personaje
    characterId: string;     // id del personaje
    conquestEndBlock: string;
    blocksRemaining: string;
  };
}

class GameStateManager extends EventEmitter {
  updateBlockConquestStarted(event: BlockConquestStartedEvent) {
    // Emite el evento 'blockConquestStarted' para que los listeners (p.ej., Positions.tsx) puedan actualizar el estado
    this.emit('blockConquestStarted', event);
  }
}

export default new GameStateManager();


