// utils/uiHelpers.ts
import Phaser from 'phaser';

export function createTooltip(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  block: { supplyBlock: number }
): Phaser.GameObjects.Container {
  // Si existe un tooltip anterior, se destruye (esto lo puedes manejar en la escena)
  const isoX = sprite.x;
  const isoY = sprite.y;
  const tooltip = scene.add.container(isoX + 50, isoY - 40);
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.8);
  bg.fillRoundedRect(0, 0, 200, 60, 10);
  const text = scene.add.text(10, 10, `ID: ${sprite.getData("blockId")}\nSupply: ${block.supplyBlock}`, {
    fontSize: '12px',
    color: '#ffffff',
  });
  tooltip.add([bg, text]);
  scene.add.existing(tooltip);
  return tooltip;
}
