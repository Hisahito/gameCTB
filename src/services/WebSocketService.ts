// src/services/WebSocketService.ts
import { io, Socket } from 'socket.io-client';
import GameStateManager from '../managers/GameStateManager';
import { BlockConquestStartedEvent, BlockState } from '../managers/GameStateManager';

class WebSocketService {
  public socket: Socket;

  constructor(url: string) {
    // Conexión usando socket.io-client
    console.log("Inicializando WebSocketService con URL:", url);
    this.socket = io(url, { transports: ['websocket'] });
    this.registerListeners();
    this.registerConnectionEvents();
  }

  private registerListeners(): void {
    // Escucha el evento 'newEvent' emitido por el backend
    this.socket.on('newEvent', (data: any) => {
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
      GameStateManager.updateBlockState(data as BlockState);
    });
  }

  // Eventos de conexión para depuración
  private registerConnectionEvents(): void {
    this.socket.on('connect', () => {
      console.log('Socket conectado. ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.warn('Socket desconectado:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Error de conexión:', error);
    });
  }

  // Método opcional para enviar mensajes al backend si es necesario
  public sendMessage(event: string, payload: any): void {
    this.socket.emit(event, payload);
  }
}

export default WebSocketService;




