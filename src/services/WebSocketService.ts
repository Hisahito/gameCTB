// src/services/WebSocketService.ts
import GameStateManager from '../managers/GameStateManager';

class WebSocketService {
  private socket: WebSocket;

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    // Supongamos que el mensaje trae un JSON con la siguiente estructura:
    // { blocks: [{ blockId, state }], characters: [{ characterId, status, position }] }
    const data = JSON.parse(event.data);

    if (data.characters) {
      data.characters.forEach((charUpdate: any) => {
        GameStateManager.updateCharacterState(charUpdate);
      });
    }
  }
}

export default WebSocketService;
