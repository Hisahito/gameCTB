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
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private selectedBlock: Phaser.GameObjects.Sprite | null = null;
  private tooltip: Phaser.GameObjects.Container | null = null;
  private highlight!: Phaser.GameObjects.Graphics;
  // Container para los sprites de los bloques (world)
  private blockContainer!: Phaser.GameObjects.Container;
  // Map anidado para los sprites de los personajes:
  // key: characterId, value: Map donde key es blockId y value es el sprite
  private charactersMap: Map<number, Map<number, Phaser.GameObjects.Sprite>> = new Map();
  // Número actual de bloque (actualizado vía evento)
  private currentBlockNumber: number = 0;

  
  
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

    // En create() o donde se establezca el listener de blockNumber
GameStateManager.on('blockNumber', (bn: string) => {
    this.currentBlockNumber = parseInt(bn);
    // Recalcular el tinte de cada bloque según el BlockState almacenado
    this.blockContainer.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Sprite) {
        const blockState = child.getData('blockState') as BlockState | undefined;
        if (blockState) {
          this.applyStatusTint(child, blockState);
        }
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

    // Container para almacenar los sprites de los bloques
    this.blockContainer = this.add.container();
    this.renderBlocks();
    this.fetchHistoricalPositions();
    this.fetchBlockStatus();

    // Suscribirse a eventos en tiempo real para actualización de bloques
    GameStateManager.on('blockUpdated', (newEvent: BlockState) => {
      this.handleBlockUpdated(newEvent);
    });
    GameStateManager.on('blockConquestStarted', (newEvent: BlockState) => {
      this.handleBlockConquestStarted(newEvent);
    });
  }

  renderBlocks() {
    const defaultTextures = [
      { key: 'pasto', probability: 0.75 },
      { key: 'grass2', probability: 0.15 },
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

      let texture: string | null = null;
      if (category === 'Special Cluster 1') texture = 'agua';
      if (category === 'Special Cluster 2') texture = 'tower1';
      if (category === 'Special Cluster 3') texture = 'gchest';
      if (category === 'Special Cluster 4') texture = 'grass2';
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
          // Para simplificar, aquí se podría actualizar el sprite del soldado del bloque anterior
        }

        this.tweens.add({
          targets: sprite,
          y: sprite.y - 10,
          duration: 200,
          ease: 'Power1',
        });
        const blockId = sprite.getData('blockId');
        if (pointer.rightButtonDown()) {
          window.dispatchEvent(new CustomEvent('blockSelected', { detail: { blockId } }));
        }

        if (this.tooltip) this.tooltip.destroy();
        this.tooltip = createTooltip(this, sprite, block);
        this.selectedBlock = sprite;
      });

      sprite.on('pointerover', () => {
        // Se aplicará el tinte según el status, así que aquí podríamos poner un tinte temporal
        sprite.setTint(0xBF3131);
      });
      sprite.on('pointerout', () => {
        const staticTint = sprite.getData('staticTint') || 0xffffff;
        sprite.setTint(staticTint);
      });

      this.blockContainer.add(sprite);
    });
  }

  async fetchHistoricalPositions() {
    try {
      const response = await fetch(`${BACKEND_URL}/blocks`);
      const data = await response.json();
      const blocks: BlockState[] = data.blocks;
      const validStatuses = ['defendido', 'redominio', 'vasallo'];

      blocks.forEach((blockState) => {
        if (!validStatuses.includes(blockState.status)) return;

        let controllingCharacter: number | null = null;
        if (blockState.status === 'defendido') {
          controllingCharacter = blockState.owner ? Number(blockState.owner) : null;
        } else if (blockState.status === 'redominio') {
          controllingCharacter = blockState.lastOwner ? Number(blockState.lastOwner) : null;
        } else if (blockState.status === 'vasallo') {
          controllingCharacter = blockState.ally ? Number(blockState.ally) : null;
        }

        if (!controllingCharacter) return;

        const blockIdNum = Number(blockState.blockId);
        const block = this.blockData.find((b) => b.blockId === blockIdNum);
        if (block) {
          const isoX = (block.x - block.y) * (tileWidth * 0.3);
          const isoY = (block.x + block.y) * (tileHeight * 0.3);
          let charSprites = this.charactersMap.get(controllingCharacter);
          if (!charSprites) {
            charSprites = new Map<number, Phaser.GameObjects.Sprite>();
            this.charactersMap.set(controllingCharacter, charSprites);
          }
          if (charSprites.has(blockIdNum)) {
            const sprite = charSprites.get(blockIdNum)!;
            sprite.x = isoX;
            sprite.y = isoY + 20;
          } else {
            const sprite = this.add.sprite(isoX, isoY + 20, 'soldierIdle').setOrigin(0.5, 1);
            sprite.play('idle');
            sprite.setDepth(isoY + 20);
            charSprites.set(blockIdNum, sprite);
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener bloques históricos:', error);
    }
  }

  async fetchBlockStatus() {
    try {
      const response = await fetch(`${BACKEND_URL}/blocks`);
      const data = await response.json();
      const blocks: BlockState[] = data.blocks;
      blocks.forEach((blockState) => {
        const blockId = parseInt(blockState.blockId);
        const blockSprite = this.getBlockSpriteById(blockId);
        if (blockSprite) {
          this.applyStatusTint(blockSprite, blockState);
        } else {
          console.warn(`No se encontró sprite para el bloque ${blockId}`);
        }
      });
    } catch (error) {
      console.error('Error al obtener el estado de los bloques:', error);
    }
  }

  private applyStatusTint(sprite: Phaser.GameObjects.Sprite, blockState: BlockState) {
    // Calcular el estado efectivo: si currentBlockNumber < conquestEnd, es "en progreso"
    let effectiveStatus = blockState.status;
    if (blockState.conquestEnd && this.currentBlockNumber > 0 && this.currentBlockNumber < Number(blockState.conquestEnd)) {
      effectiveStatus = 'en progreso';
    }
    let tint = 0xffffff; // por defecto
    switch (effectiveStatus) {
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
      case 'en progreso':
        tint = 0x800080; // púrpura
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
      (child) =>
        child instanceof Phaser.GameObjects.Sprite &&
        child.getData('blockId') === blockId
    ) as Phaser.GameObjects.Sprite;
  }

  handleBlockConquestStarted(newBlockState: BlockState) {
    const validStatuses = ['defendido', 'redominio', 'vasallo'];
    if (!validStatuses.includes(newBlockState.status)) {
      console.warn(`Estado ${newBlockState.status} no es válido para actualizar posición.`);
      return;
    }
  
    let controllingCharacter: number | null = null;
    if (newBlockState.status === 'defendido') {
      controllingCharacter = newBlockState.owner ? Number(newBlockState.owner) : null;
    } else if (newBlockState.status === 'redominio') {
      controllingCharacter = newBlockState.lastOwner ? Number(newBlockState.lastOwner) : null;
    } else if (newBlockState.status === 'vasallo') {
      controllingCharacter = newBlockState.ally ? Number(newBlockState.ally) : null;
    }
  
    if (!controllingCharacter) {
      console.warn("No se pudo determinar el controlador para el bloque:", newBlockState);
      return;
    }
  
    const newBlockId = Number(newBlockState.blockId);
    const block = this.blockData.find((b) => b.blockId === newBlockId);
    if (!block) {
      console.warn(`No se encontró bloque con blockId ${newBlockId}`);
      return;
    }
  
    const isoX = (block.x - block.y) * (tileWidth * 0.3);
    const isoY = (block.x + block.y) * (tileHeight * 0.3);
  
    let charSprites = this.charactersMap.get(controllingCharacter);
    if (!charSprites) {
      charSprites = new Map<number, Phaser.GameObjects.Sprite>();
      this.charactersMap.set(controllingCharacter, charSprites);
    }
  
    if (charSprites.has(newBlockId)) {
      const sprite = charSprites.get(newBlockId)!;
      console.log(`Actualizando sprite del personaje ${controllingCharacter} en bloque ${newBlockId} a posición: (${isoX}, ${isoY + 20})`);
      this.tweens.add({
        targets: sprite,
        x: isoX,
        y: isoY + 20,
        duration: 500,
        ease: 'Power1',
        onComplete: () => {
          console.log(`Sprite del personaje ${controllingCharacter} en bloque ${newBlockId} actualizado.`);
        }
      });
    } else {
      console.log(`No se encontró sprite para el personaje ${controllingCharacter} en bloque ${newBlockId}, se crea uno nuevo.`);
      const sprite = this.add.sprite(isoX, isoY + 20, 'soldierIdle').setOrigin(0.5, 1);
      sprite.play('idle');
      sprite.setDepth(isoY + 20);
      charSprites.set(newBlockId, sprite);
    }
  }
  
  handleBlockUpdated(newEvent: BlockState) {
    console.log("Evento blockUpdated recibido:", newEvent);
    const blockId = parseInt(newEvent.blockId);
    const blockSprite = this.getBlockSpriteById(blockId);
    if (blockSprite) {
      // Guardamos el BlockState en el sprite para recalcular el tinte luego
      blockSprite.setData('blockState', newEvent);
      this.applyStatusTint(blockSprite, newEvent);
    } else {
      console.warn(`No se encontró sprite para el bloque ${blockId}`);
    }
  }
  
  
  shutdown() {
    GameStateManager.off('blockConquestStarted', this.handleBlockConquestStarted, this);
    GameStateManager.off('blockUpdated', this.handleBlockUpdated, this);
  }
}

