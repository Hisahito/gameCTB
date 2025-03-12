// src/services/WebSocketService.ts
import { io, Socket } from 'socket.io-client';
import GameStateManager from '../managers/GameStateManager';
import { BlockConquestStartedEvent ,BlockState} from '../managers/GameStateManager';

class WebSocketService {
  private socket: Socket;

  constructor(url: string) {
    // Conexión usando socket.io-client
    this.socket = io(url, { transports: ['websocket'] });
    this.registerListeners();
  }

  private registerListeners(): void {
    // Escucha el evento 'newEvent' emitido por el backend
    this.socket.on('newEvent', (data: any) => {
      // Solo manejamos los eventos BlockConquestStarted en este ejemplo
      if (data.eventName === 'BlockConquestStarted') {
        GameStateManager.updateBlockConquestStarted(data as BlockConquestStartedEvent);
      }
    });

    // Escucha el evento 'blockNumber' para actualizar el contador global
    this.socket.on('blockNumber', (data: string) => {
      GameStateManager.updateBlockNumber(data);
    });

    // Escucha el evento 'blockUpdated' emitido por el backend
    this.socket.on('blockUpdated', (data: any) => {
        // Suponemos que data contiene el estado actualizado del bloque
        GameStateManager.updateBlockState(data as BlockState);
      });

  }

  

  // Método opcional para enviar mensajes al backend si es necesario
  public sendMessage(event: string, payload: any): void {
    this.socket.emit(event, payload);
  }
}

export default WebSocketService;



