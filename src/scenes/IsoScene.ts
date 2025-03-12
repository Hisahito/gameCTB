// src/scenes/IsoScene.ts
import Phaser from 'phaser';
import { createTooltip } from '../utils/uiHelpers';
import { getDeterministicTexture } from '../utils/textureUtils';
import images from '../assets';
import GameStateManager, { BlockConquestStartedEvent, BlockState } from '../managers/GameStateManager';

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

export default class IsoScene extends Phaser.Scene {
  private blockData: Block[] = [];
  private charactersMap: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private selectedBlock: Phaser.GameObjects.Sprite | null = null;
  private tooltip: Phaser.GameObjects.Container | null = null;
  private highlight!: Phaser.GameObjects.Graphics;
  // Nueva propiedad para almacenar los sprites de los bloques y poder acceder a ellos luego
  private blockContainer!: Phaser.GameObjects.Container;

  preload() {
    // Cargar imágenes y assets
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

    // Cargar el JSON del mapa (world) – se mantiene estático
    this.load.json('world', 'Canonical.json');

    // Cargar el sprite sheet del personaje (6 frames de 100x100)
    this.load.spritesheet('soldierIdle', images.soldierIdle, { frameWidth: 100, frameHeight: 100 });
  }

  create() {
    // Deshabilitar el menú contextual
    this.input.mouse?.disableContextMenu();

    this.blockData = this.cache.json.get('world');

    this.camera = this.cameras.main;
    this.camera.setZoom(1);
    this.camera.setBounds(-3000, -3000, 6000, 6000);
    this.camera.centerOn(0, 0);

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('soldierIdle', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.camera.scrollX -= pointer.velocity.x / 5;
        this.camera.scrollY -= pointer.velocity.y / 5;
      }
    });

    const wheelHandler = (event: WheelEvent) => {
      if (event.deltaY > 0) {
        this.camera.zoom = Math.max(0.5, this.camera.zoom - 0.1);
      } else {
        this.camera.zoom = Math.min(2, this.camera.zoom + 0.1);
      }
    };
    window.addEventListener('wheel', wheelHandler);
    this.events.on('destroy', () => {
      window.removeEventListener('wheel', wheelHandler);
    });

    this.highlight = this.add.graphics();
    this.highlight.lineStyle(3, 0xffff00);
    this.highlight.visible = false;
    this.add.existing(this.highlight);

    // Se crea un container para almacenar los sprites de los bloques
    this.blockContainer = this.add.container();
    this.renderBlocks();
    this.fetchHistoricalPositions();
    this.fetchBlockStatus(); // Nueva función para obtener el estado de los bloques

    // Suscribirse a eventos en tiempo real
    GameStateManager.on('blockConquestStarted', (newEvent: BlockConquestStartedEvent) => {
      this.handleBlockConquestStarted(newEvent);
    });

    // Suscribirse a eventos en tiempo real para actualización de bloque
    GameStateManager.on('blockUpdated', (newEvent: BlockState) => {
      this.handleBlockUpdated(newEvent);
    });
  }

  renderBlocks() {
    const defaultTextures = [
      { key: 'pasto', probability: 0.85 },
      { key: 'grass2', probability: 0.05 },
      { key: 'grass3', probability: 0.04 },
      { key: 'grass4', probability: 0.05 },
      { key: 'grass5', probability: 0.01 },
    ];

    const woodsTextures = [
      { key: 'woods3', probability: 0.5 },
      { key: 'woods2', probability: 0.4 },
      { key: 'woods1', probability: 0.1 },
    ];

    const spacingFactorX = 0.3;
    const spacingFactorY = 0.3;

    this.blockData.forEach((block) => {
      const { x, y, category, only } = block;
      const isoX = (x - y) * (tileWidth * spacingFactorX);
      const isoY = (x + y) * (tileHeight * spacingFactorY);

      let texture = null;
      if (category === 'Special Cluster 1') texture = 'agua';
      if (category === 'Special Cluster 2') texture = 'tower1';
      if (category === 'Special Cluster 3') texture = 'gchest';
      if (category === 'Special Cluster 4') texture = 'pasto';
      if (category === 'Special Cluster 5') texture = 'castillo';
      if (only === 1) texture = getDeterministicTexture(woodsTextures, block.blockId);
      if (only === 3) texture = 'agua';
      if (only === 6) texture = 'agua';
      if (only === 8) texture = 'castillo';

      if (!texture) {
        texture = getDeterministicTexture(defaultTextures, block.blockId);
      }

      const sprite = this.add.sprite(isoX, isoY, texture).setOrigin(0.5, 1);
      sprite.setData('blockId', block.blockId);

      const hitArea = new Phaser.Geom.Polygon([
        new Phaser.Geom.Point(sprite.width / 2, sprite.height - tileHeight),
        new Phaser.Geom.Point(sprite.width / 2 + tileWidth / 2, sprite.height - tileHeight / 2),
        new Phaser.Geom.Point(sprite.width / 2, sprite.height),
        new Phaser.Geom.Point(sprite.width / 2 - tileWidth / 2, sprite.height - tileHeight / 2),
      ]);
      sprite.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);

      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.selectedBlock === sprite) return;

        if (this.selectedBlock) {
          this.tweens.add({
            targets: this.selectedBlock,
            y: this.selectedBlock.y + 10,
            duration: 200,
            ease: 'Power1',
          });
          const prevBlockId = this.selectedBlock.getData('blockId');
          const prevSoldier = this.charactersMap.get(prevBlockId);
          if (prevSoldier) {
            this.tweens.add({
              targets: prevSoldier,
              y: prevSoldier.y + 10,
              duration: 200,
              ease: 'Power1',
            });
          }
        }

        this.tweens.add({
          targets: sprite,
          y: sprite.y - 10,
          duration: 200,
          ease: 'Power1',
        });
        const blockId = sprite.getData('blockId');
        const soldier = this.charactersMap.get(blockId);
        if (soldier) {
          this.tweens.add({
            targets: soldier,
            y: soldier.y - 10,
            duration: 200,
            ease: 'Power1',
          });
        }
        this.selectedBlock = sprite;

        if (pointer.rightButtonDown()) {
          window.dispatchEvent(new CustomEvent('blockSelected', { detail: { blockId } }));
        }

        if (this.tooltip) this.tooltip.destroy();
        this.tooltip = createTooltip(this, sprite, block);
      });

      sprite.on('pointerover', () => {
        sprite.setTint(0xBF3131);
      });
      sprite.on('pointerout', () => {
    const staticTint = sprite.getData('staticTint') || 0xffffff;
  sprite.setTint(staticTint);
      });

      // Agregar el sprite al container de bloques
      this.blockContainer.add(sprite);
    });
  }

  async fetchHistoricalPositions() {
    try {
      const response = await fetch(`${BACKEND_URL}/positions`);
      const data = await response.json();
      const positions = data.positions;
      for (const key in positions) {
        const event = positions[key];
        const characterId = Number(event.args.characterId);
        const newBlockId = Number(event.args.blockId);
        const block = this.blockData.find((b) => b.blockId === newBlockId);
        if (block) {
          const isoX = (block.x - block.y) * (tileWidth * 0.3);
          const isoY = (block.x + block.y) * (tileHeight * 0.3);
          let sprite = this.charactersMap.get(characterId);
          if (!sprite) {
            sprite = this.add.sprite(isoX, isoY + 20, 'soldierIdle').setOrigin(0.5, 1);
            sprite.play('idle');
            sprite.setDepth(isoY + 20);
            this.charactersMap.set(characterId, sprite);
          } else {
            sprite.x = isoX;
            sprite.y = isoY + 20;
          }
        }
      }
    } catch (error) {
      console.error('Error al obtener posiciones históricas:', error);
    }
  }

  // Nueva función para obtener el estado de los bloques y pintarlos según su status
  async fetchBlockStatus() {
    try {
      const response = await fetch(`${BACKEND_URL}/blocks`);
      const data = await response.json();
      // Se asume que la respuesta tiene la propiedad "blocks" que es un array de BlockState
      const blocks: BlockState[] = data.blocks;
      blocks.forEach((blockState) => {
        const blockId = parseInt(blockState.blockId);
        const blockSprite = this.getBlockSpriteById(blockId);
        if (blockSprite) {
          this.applyStatusTint(blockSprite, blockState.status);
        } else {
          console.warn(`No se encontró sprite para el bloque ${blockId}`);
        }
      });
    } catch (error) {
      console.error('Error al obtener el estado de los bloques:', error);
    }
  }

  // Función auxiliar para aplicar el tinte según el status
  private applyStatusTint(sprite: Phaser.GameObjects.Sprite, status: string) {
    let tint = 0xffffff; // Color por defecto
    switch (status) {
      case 'dominio':
        tint = 0xffa500; // naranja
        break;
      case 'redominio':
        tint = 0xff0000; // rojo
        break;
      case 'defendido':
        tint = 0x0000ff; // azul
        break;
      case 'vasallo':
        tint = 0x00ff00; // verde fuerte
        break;
      default:
        break;
    }
    sprite.setData('staticTint', tint);
    sprite.setTint(tint);
  }

  // Función auxiliar para obtener el sprite de un bloque dado su blockId
  private getBlockSpriteById(blockId: number): Phaser.GameObjects.Sprite | undefined {
    return this.blockContainer.list.find(
      (child) => child instanceof Phaser.GameObjects.Sprite && child.getData('blockId') === blockId
    ) as Phaser.GameObjects.Sprite;
  }

  handleBlockConquestStarted(newEvent: BlockConquestStartedEvent) {
    console.log("Evento blockConquestStarted recibido:", newEvent);
    if (!this.blockData) {
      console.warn("blockData no está definido en este momento.");
      return;
    }
    const characterId = Number(newEvent.args.characterId);
    const newBlockId = Number(newEvent.args.blockId);
    const block = this.blockData.find((b) => b.blockId === newBlockId);
    if (block) {
      const isoX = (block.x - block.y) * (tileWidth * 0.3);
      const isoY = (block.x + block.y) * (tileHeight * 0.3);
      let sprite = this.charactersMap.get(characterId);
      if (sprite) {
        console.log(`Actualizando sprite del personaje ${characterId} a posición: (${isoX}, ${isoY + 20})`);
        this.tweens.add({
          targets: sprite,
          x: isoX,
          y: isoY + 20,
          duration: 500,
          ease: 'Power1',
          onComplete: () => {
            console.log(`Sprite del personaje ${characterId} actualizado.`);
          }
        });
      } else {
        console.log(`No se encontró sprite para el personaje ${characterId}, se crea uno nuevo.`);
        sprite = this.add.sprite(isoX, isoY + 20, 'soldierIdle').setOrigin(0.5, 1);
        sprite.play('idle');
        sprite.setDepth(isoY + 20);
        this.charactersMap.set(characterId, sprite);
      }
    } else {
      console.warn(`No se encontró bloque con blockId ${newBlockId}`);
    }
  }

  // Actualiza el tinte del bloque cuando se recibe un evento de actualización
  handleBlockUpdated(newEvent: BlockState) {
    console.log("Evento blockUpdated recibido:", newEvent);
    const blockId = parseInt(newEvent.blockId);
    const blockSprite = this.getBlockSpriteById(blockId);
    if (blockSprite) {
      this.applyStatusTint(blockSprite, newEvent.status);
    } else {
      console.warn(`No se encontró sprite para el bloque ${blockId}`);
    }
  }
  
  shutdown() {
    GameStateManager.off('blockConquestStarted', this.handleBlockConquestStarted, this);
    GameStateManager.off('blockUpdated', this.handleBlockUpdated, this);
  }
}

