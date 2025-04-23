import Phaser from 'phaser';
import { createTooltip } from '../utils/uiHelpers';
import { getDeterministicTexture } from '../utils/textureUtils';
import images from '../assets';
import GameStateManager, { BlockState } from '../managers/GameStateManager';
import {
  createBlockWithOverlay,
  getDepthForLayer,
  getBlockContainerById,
  updateOverlaysNearBlock,
  fetchHistoricalPositions,
  fetchBlockStatus,
  handleBlockConquestStarted,
  IsoSceneContext
} from '../utils/blockHelpers';

import { setupPhaserUIEvents } from '../utils/phaserUIEvents'; 

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
const BACKEND_URL = 'http://localhost:3000';

export default class IsoScene extends Phaser.Scene implements IsoSceneContext {
  public blockData: Block[] = [];
  public camera!: Phaser.Cameras.Scene2D.Camera;
  public selectedBlock: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | null = null;
  public tooltip: Phaser.GameObjects.Container | null = null;
  public highlight!: Phaser.GameObjects.Graphics;
  public blockContainer!: Phaser.GameObjects.Container;
  public charactersMap: Map<number, Map<number, Phaser.GameObjects.Sprite>> = new Map();
  public currentBlockNumber: number = 0;

  public getDepthForLayer = getDepthForLayer;
  public getBlockContainerById = (blockId: number) => getBlockContainerById(this, blockId);
  public updateOverlaysNearBlock = (blockId: number, character: Phaser.GameObjects.Sprite) => updateOverlaysNearBlock(this, blockId, character);

  preload() {
    this.load.image('castillo', images.castillo);
    this.load.image('cofre', images.cofre);
    this.load.image('torre', images.pasto);
    this.load.image('pasto', images.pasto);
    this.load.image('grass2', images.grass2);
    this.load.image('grass3', images.grass3);
    this.load.image('grass4', images.grass4);
    this.load.image('grass5', images.grass5);
    this.load.image('tower1', images.tower1);
    this.load.image('ngrass', images.nightBlock);
    this.load.image('agua', images.agua);
    this.load.image('bosque', images.bosque);
    this.load.image('piedra', images.piedra);
    this.load.image('woods', images.blockWoods);
    this.load.image('woods1', images.woods1);
    this.load.image('woods2', images.woods2);
    this.load.image('woods3', images.woods3);
    this.load.image('gchest', images.cofre);
    this.load.image('bunny', images.bunny);
    this.load.image('grasshd', images.grasshd);
    this.load.image('pine', images.pine);
    this.load.json('world', 'Canonical.json');
    this.load.spritesheet('soldierIdle', images.soldierIdle, { frameWidth: 100, frameHeight: 100 });
  }

  create() {
    this.input.mouse?.disableContextMenu();
    this.blockData = this.cache.json.get('world');
    this.camera = this.cameras.main;
    this.camera.setZoom(1);
    this.camera.setBounds(-3000, -3000, 6000, 6000);
    this.camera.centerOn(0, 0);

    setupPhaserUIEvents(this);

    // Listener Reloj interno , actualiza en tiempo real
    GameStateManager.on('blockNumber', (bn: string) => {
      console.log(bn);
      this.currentBlockNumber = parseInt(bn);
      this.blockContainer.list.forEach((child) => {
        let sprite: Phaser.GameObjects.Sprite | null = null;
        if (child instanceof Phaser.GameObjects.Sprite) {
          sprite = child;
        } else if (child instanceof Phaser.GameObjects.Container) {
          sprite = child.getAt(0) as Phaser.GameObjects.Sprite;
        }
        if (sprite) {
          const blockState = sprite.getData('blockState') as BlockState | undefined;
          if (blockState) this.applyStatusTint(sprite, blockState);
        }
      });
    });

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
    fetchHistoricalPositions(this, BACKEND_URL, tileWidth, tileHeight);
    fetchBlockStatus(this, BACKEND_URL);

    GameStateManager.on('blockUpdated', this.handleBlockUpdated.bind(this));
    GameStateManager.on('blockUpdated', (e) => handleBlockConquestStarted(this, e, tileWidth, tileHeight));
  }

  public renderBlocks() {
    const spacingFactorX = 0.3;
    const spacingFactorY = 0.3;

    this.blockData.forEach((block) => {
      const { x, y, category, only } = block;
      const isoX = (x - y) * (tileWidth * spacingFactorX);
      const isoY = (x + y) * (tileHeight * spacingFactorY);

      if (only === 1) {
        createBlockWithOverlay(this, block, isoX, isoY, 'grasshd', 'pine', 15, true);
        return;
      }

      let texture: string | null = null;
      if (category === 'Special Cluster 1') texture = 'agua';
      else if (category === 'Special Cluster 2') texture = 'tower1';
      else if (category === 'Special Cluster 3') texture = 'gchest';
      else if (category === 'Special Cluster 4') texture = 'grasshd';
      else if (category === 'Special Cluster 5') texture = 'castillo';
      else if (only === 3) texture = 'bunny';
      else if (only === 6) texture = 'agua';
      else if (only === 8) texture = 'castillo';
      if (!texture) texture = getDeterministicTexture([{ key: 'grasshd', probability: 1 }], block.blockId);

      const sprite = this.add.sprite(isoX, isoY, texture).setOrigin(0.5, 1);
      sprite.setData('blockId', block.blockId);
      if (texture === 'bunny') sprite.setScale(0.5);

      sprite.setInteractive(new Phaser.Geom.Polygon([
        new Phaser.Geom.Point(sprite.width / 2, sprite.height - tileHeight),
        new Phaser.Geom.Point(sprite.width / 2 + tileWidth / 2, sprite.height - tileHeight / 2),
        new Phaser.Geom.Point(sprite.width / 2, sprite.height),
        new Phaser.Geom.Point(sprite.width / 2 - tileWidth / 2, sprite.height - tileHeight / 2),
      ]), Phaser.Geom.Polygon.Contains);



      //Animacion de hover tinte

      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Si el sprite ya está seleccionado, no hacemos nada
        if (this.selectedBlock === sprite) return;
      
        // Si hay un bloque seleccionado previamente, bajarlo junto al personaje asociado
        if (this.selectedBlock) {
          this.tweens.add({
            targets: this.selectedBlock,
            y: this.selectedBlock.y + 10,
            duration: 200,
            ease: 'Power1'
          });
          // Obtenemos el blockId del bloque seleccionado
          const prevBlockId = this.selectedBlock.getData('blockId');
          // Buscamos el sprite del personaje asociado al bloque anterior
          const prevCharSprite = this.getCharacterSpriteForBlock(prevBlockId);
          if (prevCharSprite) {
            this.tweens.add({
              targets: prevCharSprite,
              y: prevCharSprite.y + 10,
              duration: 200,
              ease: 'Power1'
            });
          }
        }
      
        // Animamos el bloque actual para elevarlo 10 píxeles
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 10,
          duration: 200,
          ease: 'Power1'
        });
      
        // También, obtenemos y elevamos el sprite del personaje asociado al bloque actual
        const blockId = sprite.getData('blockId');
        const charSprite = this.getCharacterSpriteForBlock(blockId);
        if (charSprite) {
          this.tweens.add({
            targets: charSprite,
            y: charSprite.y - 10,
            duration: 200,
            ease: 'Power1'
          });
        }
      
        if (pointer.rightButtonDown()) {
          window.dispatchEvent(new CustomEvent('blockSelected', { detail: { blockId } }));
        }
        if (this.tooltip) this.tooltip.destroy();
        this.tooltip = createTooltip(this, sprite, block);
        this.selectedBlock = sprite;
      });
      
      

      sprite.on('pointerover', () => sprite.setTint(0xBF3131));
      sprite.on('pointerout', () => sprite.setTint(sprite.getData('staticTint') || 0xffffff));
      sprite.setDepth(this.getDepthForLayer('object', isoY));
      this.blockContainer.add(sprite);
    });

    
  }

    //terminda

  // Función actualizada que retorna el sprite asociado, ya sea directamente o el primer hijo de un container.
  public getBlockSpriteById(blockId: number): Phaser.GameObjects.Sprite | undefined {
    for (const child of this.blockContainer.list) {
      if (child instanceof Phaser.GameObjects.Sprite && child.getData('blockId') === blockId) {
        return child;
      }
      if (child instanceof Phaser.GameObjects.Container && child.getData('blockId') === blockId) {
        const groundSprite = child.getAt(0) as Phaser.GameObjects.Sprite;
        if (groundSprite) return groundSprite;
      }
    }
    return undefined;
  }

  public applyStatusTint(sprite: Phaser.GameObjects.Sprite, blockState: BlockState) {
    let effectiveStatus = blockState.status;
    if (blockState.conquestEnd && this.currentBlockNumber > 0 && this.currentBlockNumber < Number(blockState.conquestEnd)) {
      effectiveStatus = 'en progreso';
    }
    let tint = 0xffffff;
    switch (effectiveStatus) {
      case 'dominio': tint = 0xffa500; break;
      case 'redominio': tint = 0xff0000; break;
      case 'defendido': tint = 0x0000ff; break;
      case 'vasallo': tint = 0x00ff00; break;
      case 'en progreso': tint = 0x800080; break;
    }
    sprite.setData('staticTint', tint);
    sprite.setTint(tint);
  }

  public getCharacterSpriteForBlock(blockId: number): Phaser.GameObjects.Sprite | undefined {
    for (const charMap of this.charactersMap.values()) {
      if (charMap.has(blockId)) return charMap.get(blockId);
    }
    return undefined;
  }

  // Actualiza el estado del bloque y, en caso de concluir la conquista, mueve el sprite del personaje
  public handleBlockUpdated(newEvent: BlockState) {
    const blockId = parseInt(newEvent.blockId);
    const blockSprite = this.getBlockSpriteById(blockId);
    if (blockSprite) {
      blockSprite.setData('blockState', newEvent);
      this.applyStatusTint(blockSprite, newEvent);

      // Si la conquista finalizó, mover el sprite del personaje.
      if (newEvent.conquestEnd && this.currentBlockNumber >= Number(newEvent.conquestEnd)) {
        const characterId = (newEvent.owner || newEvent.lastOwner || newEvent.ally);
        if (characterId) {
          const charSprites = this.charactersMap.get(Number(characterId));
          if (charSprites && charSprites.has(blockId)) {
            const charSprite = charSprites.get(blockId)!;
            const block = this.blockData.find(b => b.blockId === blockId);
            if (block) {
              const isoX = (block.x - block.y) * (tileWidth * 0.3);
              const isoY = (block.x + block.y) * (tileHeight * 0.3);
              this.tweens.add({
                targets: charSprite,
                x: isoX,
                y: isoY + 20,
                duration: 500,
                ease: 'Power1',
                onComplete: () => this.updateOverlaysNearBlock(blockId, charSprite)
              });
            }
          }
        }
      }
    } else {
      console.warn(`No se encontró sprite para el bloque ${blockId}`);
    }
  }

  shutdown() {
    GameStateManager.off('blockConquestStarted', this.handleBlockConquestStarted, this);
    GameStateManager.off('blockUpdated', this.handleBlockUpdated, this);
  }
}


