import Phaser from 'phaser';
import { createTooltip } from '../utils/uiHelpers';
import { getDeterministicTexture } from '../utils/textureUtils';
import images from '../assets';
import { Position, useGlobalPositions } from '../context/GlobalPositionsContext';
import { triggerFetchCharacterStats, onCharacterStatsFetched } from '../utils/rangeEvents';


export interface Block {
  blockId: number;
  x: number;
  y: number;
  category: string;
  supplyBlock: number;
  afinity: number[];
  only: number;
}

const tileWidth = 64;
const tileHeight = 32;

export default class IsoScene extends Phaser.Scene {
  public blockData: Block[] = [];
  public camera!: Phaser.Cameras.Scene2D.Camera;
  public selectedBlock: Phaser.GameObjects.Sprite | null = null;
  public tooltipElement: HTMLDivElement | null = null;
  public highlight!: Phaser.GameObjects.Graphics;
  public blockContainer!: Phaser.GameObjects.Container;
  public characterSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  public abilityHighlights: Phaser.GameObjects.Sprite[] = [];



  preload() {
    Object.entries(images).forEach(([key, value]) => this.load.image(key, value));
    this.load.json('world', 'Canonical.json');
  }

  create() {


    window.addEventListener('renderAbilityRange', (e: any) => {
        this.clearAbilityHighlights();
        console.log('evento habilidad',e.detail);
        const { affectedBlocks } = e.detail;
      
        for (const { x, y } of affectedBlocks) {
          const block = this.blockData.find(b => b.x === x && b.y === y);
          if (!block) continue;
      
          const sprite = this.blockContainer.list.find(
            (s: any) => s.getData('blockId') === block.blockId
          ) as Phaser.GameObjects.Sprite;
      
          if (sprite) {
            sprite.setTint(0xff4444);
            this.abilityHighlights.push(sprite);
          }
        }
      });
      
      

      
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const target = pointer.event.target as HTMLElement;
        if (target.closest('.ui-blocker')) {
          pointer.event.stopPropagation();
        }
      });

    this.input.mouse?.disableContextMenu();
    this.blockData = this.cache.json.get('world');
    this.camera = this.cameras.main;
    this.camera.setZoom(1);
    this.camera.setBounds(-3000, -3000, 6000, 6000);
    this.camera.centerOn(0, 0);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.camera.scrollX -= pointer.velocity.x / 5;
        this.camera.scrollY -= pointer.velocity.y / 5;
      }
    });

    const wheelHandler = (event: WheelEvent) => {
      this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + (event.deltaY > 0 ? -0.1 : 0.1), 0.5, 2);
    };
    window.addEventListener('wheel', wheelHandler);
    this.events.on('destroy', () => window.removeEventListener('wheel', wheelHandler));

    this.highlight = this.add.graphics();
    this.highlight.lineStyle(3, 0xffff00);
    this.highlight.visible = false;
    this.add.existing(this.highlight);

    this.blockContainer = this.add.container();
    this.renderBlocks();

    

    // Crear tooltip flotante
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.style.position = 'fixed';
    this.tooltipElement.style.padding = '6px 12px';
    this.tooltipElement.style.background = 'rgba(0, 0, 0, 0.75)';
    this.tooltipElement.style.color = 'white';
    this.tooltipElement.style.fontSize = '14px';
    this.tooltipElement.style.borderRadius = '6px';
    this.tooltipElement.style.pointerEvents = 'none';
    this.tooltipElement.style.display = 'none';
    document.body.appendChild(this.tooltipElement);

    // Evento para renderizar personajes cuando se actualizan posiciones globales
    window.addEventListener('renderCharacters', (e: any) => {
      this.renderCharacters(e.detail.positions);
    });

    window.addEventListener('characterStatsFetched', (e: any) => {
        const { stats, blockId } = e.detail;
        console.log('[Phaser] Evento characterStatsFetched recibido:', e.detail);
        const range = stats[8];
       // this.renderRangeFromBlock(blockId, range);
      });

      
  }

  public renderBlocks() {
    const spacingFactorX = 0.3;
    const spacingFactorY = 0.3;

    this.blockData.forEach((block) => {
      const { x, y, category, only } = block;
      const isoX = (x - y) * (tileWidth * spacingFactorX);
      const isoY = (x + y) * (tileHeight * spacingFactorY);

      let texture: string | null = null;
      if (category === 'Special Cluster 1') texture = 'agua';
      else if (category === 'Special Cluster 2') texture = 'tower1';
      else if (category === 'Special Cluster 3') texture = 'cofre';
      else if (category === 'Special Cluster 4') texture = 'grasshd';
      else if (category === 'Special Cluster 5') texture = 'castillo';
      else if (only === 3) texture = 'bunny';
      else if (only === 1) texture = 'blockWoods';
      else if (only === 6) texture = 'agua';
      else if (only === 8) texture = 'castillo';
      if (!texture) texture = getDeterministicTexture([{ key: 'grasshd', probability: 1 }], block.blockId);

      const sprite = this.add.sprite(isoX, isoY, texture).setOrigin(0.5, 1);
      sprite.setData('blockId', block.blockId);

      sprite.setInteractive(new Phaser.Geom.Polygon([
        new Phaser.Geom.Point(sprite.width / 2, sprite.height - tileHeight),
        new Phaser.Geom.Point(sprite.width / 2 + tileWidth / 2, sprite.height - tileHeight / 2),
        new Phaser.Geom.Point(sprite.width / 2, sprite.height),
        new Phaser.Geom.Point(sprite.width / 2 - tileWidth / 2, sprite.height - tileHeight / 2),
      ]), Phaser.Geom.Polygon.Contains);

      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // ⛔ Si el puntero está sobre un div con clase "ui-blocker", ignoramos el clic
        const htmlElement = document.elementFromPoint(pointer.x, pointer.y);
        if (htmlElement?.closest('.ui-blocker')) return;
      
        const blockId = sprite.getData('blockId');
        const block = this.blockData.find((b) => b.blockId === blockId);
        if (block) {
          window.dispatchEvent(new CustomEvent('blockSelected', { detail: block }));
        }
      
        if (block && this.tooltipElement) {
          this.tooltipElement.innerText = `Bloque ID: ${block.blockId}\nCoordenadas: (${block.x}, ${block.y})`;
          this.tooltipElement.style.left = pointer.event.clientX + 10 + 'px';
          this.tooltipElement.style.top = pointer.event.clientY + 'px';
          this.tooltipElement.style.display = 'block';
        }
      });

      sprite.on('pointerover', () => sprite.setTint(0xBF3131));
      sprite.on('pointerout', () => {
        sprite.setTint(0xffffff);
        if (this.tooltipElement) this.tooltipElement.style.display = 'none';
      });

      sprite.setDepth(isoY);
      this.blockContainer.add(sprite);
    });
  }

  public renderCharacters(positions: Position[]) {
    const spacingFactorX = 0.3;
    const spacingFactorY = 0.3;
  
    positions.forEach(({ tokenId, cellId }) => {
      const block = this.blockData.find(b => b.blockId === Number(cellId));
      if (!block) return;
  
      const isoX = (block.x - block.y) * (tileWidth * spacingFactorX);
      const isoY = (block.x + block.y - 0.5) * (tileHeight * spacingFactorY);
  
      // 🐰 Crear personaje si no existe
      let character = this.characterSprites.get(tokenId);
      if (!character) {
        character = this.add.sprite(isoX, isoY, 'mage2').setOrigin(0.5, 1).setScale(0.5);
        this.characterSprites.set(tokenId, character);
  
        // 🏷️ Añadir texto del tokenId
        const label = this.add.text(isoX, isoY , `#${tokenId}`, {
          font: '12px Arial',
          color: '#ffffff',
          backgroundColor: '#00000088',
          padding: { left: 4, right: 4, top: 2, bottom: 2 }
        }).setOrigin(0.5,2);
  
        character.setData('label', label); // Guardamos referencia
  
      } else {
        character.setPosition(isoX, isoY);
        const label = character.getData('label') as Phaser.GameObjects.Text;
        if (label) label.setPosition(isoX, isoY - 40);
      }
  
      character.setDepth(isoY + 1);
    });
  }

  public clearRangeHighlights() {
    this.blockContainer.list.forEach((obj) => {
      if (obj instanceof Phaser.GameObjects.Sprite) {
        obj.clearTint();
        obj.setAlpha(1);
  
        const tween = obj.getData('rangeTween');
        if (tween && typeof tween.stop === 'function') {
          tween.stop();
          tween.destroy(); // 💥 Asegura que desaparezca
        }
  
        if (obj.data) {
          obj.data.remove('rangeTween'); // ✅ forma correcta de borrar data
        }
      }
    });
  }
  
  public clearAbilityHighlights() {
    for (const sprite of this.abilityHighlights) {
      sprite.clearTint();
    }
    this.abilityHighlights = [];
  }
  
  
  

  public renderRangeFromBlock(originBlockId: number, range: number) {
    this.clearRangeHighlights();
    const origin = this.blockData.find(b => b.blockId === originBlockId);
    if (!origin) {
      console.warn('[renderRangeFromBlock] Bloque origen no encontrado:', originBlockId);
      return;
    }
  
    const originX = origin.x;
    const originY = origin.y;
  
    let paintedCount = 0;
  
    for (const block of this.blockData) {
      const dx = block.x - originX;
      const dy = block.y - originY;
      const manhattanDistance = Math.abs(dx) + Math.abs(dy);
  
      if (manhattanDistance <= range) {
        const sprite = this.blockContainer.list.find((s: any) =>
          s.getData('blockId') === block.blockId
        ) as Phaser.GameObjects.Sprite | undefined;
  
        if (sprite) {
          sprite.setTint(0x3399ff); // Azul claro
          paintedCount++;
  
          // ✨ Animación de parpadeo
          const tween = this.tweens.add({
            targets: sprite,
            alpha: { from: 1, to: 0.4 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
  
          sprite.setData('rangeTween', tween);
        }
      }
    }
  
    console.log(`[renderRangeFromBlock] Parpadean ${paintedCount} bloques con rango ${range}`);
  }
  
  

  

}
