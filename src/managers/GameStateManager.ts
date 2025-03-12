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
    defended: string;
  };
}

export interface BlockState {
    blockId: string;
    status: string;
    owner: string | null;
    conquestEnd: string | null;
    defended: string | null;
    futureOwner?: string | null;
    lastOwner?: string | null;
    ally?: string | null;
    originalOwner?: string | null;
  }

class GameStateManager extends EventEmitter {
  updateBlockConquestStarted(event: BlockConquestStartedEvent) {
    // Emite el evento 'blockConquestStarted' para que los listeners puedan actualizar el estado
    this.emit('blockConquestStarted', event);
  }

  updateBlockNumber(newBlockNumber: string) {
    // Emite el evento 'blockNumber' para actualizar el contador
    this.emit('blockNumber', newBlockNumber);
  }

  updateBlockState(blockState: BlockState) {
    this.emit('blockUpdated', blockState);
  }
}

export default new GameStateManager();



