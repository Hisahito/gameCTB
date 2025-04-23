// phaserUIEvents.ts
import Phaser from 'phaser';
import { IsoSceneContext } from './blockHelpers'; // o donde tengas definida la interfaz de la escena

/**
 * Registra los eventos de comunicación entre Phaser y la UI.
 * @param scene La instancia de la escena desde la cual se accede a los datos (por ejemplo, charactersMap).
 */
export function setupPhaserUIEvents(scene: IsoSceneContext): void {
  window.addEventListener('getCharacterCount', () => {
    let total = 0;
    // Supongamos que charactersMap es un Map<number, Map<number, Phaser.GameObjects.Sprite>>
    scene.charactersMap.forEach(charMap => {
      total += charMap.size;
    });
    // Disparar el evento para responder con la cantidad total
    window.dispatchEvent(new CustomEvent('responseCharacterCount', { detail: { count: total } }));
  });
}
