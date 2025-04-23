import Phaser from 'phaser';
import { createTooltip } from './uiHelpers';
import { Block } from '../scenes/IsoScene';
import { BlockState } from '../managers/GameStateManager';

export interface IsoSceneContext {
  blockData: Block[];
  blockContainer: Phaser.GameObjects.Container;
  selectedBlock: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | null;
  tooltip: Phaser.GameObjects.Container | null;
  charactersMap: Map<number, Map<number, Phaser.GameObjects.Sprite>>;
  currentBlockNumber: number;
  add: Phaser.Scene['add'];
  tweens: Phaser.Scene['tweens'];
  getDepthForLayer(type: 'ground' | 'object' | 'character' | 'overlay', isoY: number): number;
  getBlockContainerById(blockId: number): Phaser.GameObjects.Container | null;
  updateOverlaysNearBlock(blockId: number, character: Phaser.GameObjects.Sprite): void;
  getBlockSpriteById?(blockId: number): Phaser.GameObjects.Sprite | undefined;
}




  interface TintConfig {
    originalTint: number;
    hoverTint: number;
  }
  
  /**
   * Configura los eventos de puntero para aplicar y quitar un tinte.
   * @param sprite El sprite sobre el que se aplicará el tinte.
   * @param config La configuración de tintes, donde se especifica el tinte original y el tinte al pasar el mouse.
   */
  export function applyHoverTint(
    sprite: Phaser.GameObjects.Sprite,
    config: TintConfig
  ): void {
    // Al pasar el ratón, se aplica el tinte hover
    sprite.setInteractive();
    sprite.on('pointerover', () => {
      sprite.setTint(config.hoverTint);
    });
    // Al salir, se restaura el tinte original (o se remueve)
    sprite.on('pointerout', () => {
        sprite.setTint(sprite.getData('staticTint')) // o sprite.setTint(config.originalTint) si necesitas mantener cierto color
    });
  }



  export function createBlockWithOverlay(
    scene: IsoSceneContext,
    block: Block,
    isoX: number,
    isoY: number,
    groundKey: string,
    overlayKey: string,
    isoYup: number,
    selectable: boolean = true
  ) {
    const container = scene.add.container(isoX, isoY);
    const ground = scene.add.sprite(0, 0, groundKey).setOrigin(0.5, 1);
    ground.setData('blockId', block.blockId);
    const overlay = scene.add.sprite(0, -isoYup, overlayKey).setOrigin(0.5, 1);
    container.add([ground, overlay]);
    container.setDepth(scene.getDepthForLayer('object', isoY));
    container.setData('blockId', block.blockId);
  
    if (selectable) {
      const hitArea = new Phaser.Geom.Polygon([
        new Phaser.Geom.Point(ground.width / 2, ground.height - 32),
        new Phaser.Geom.Point(ground.width / 2 + 32, ground.height - 16),
        new Phaser.Geom.Point(ground.width / 2, ground.height),
        new Phaser.Geom.Point(ground.width / 2 - 32, ground.height - 16),
      ]);
      ground.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
    }
  
    // Se agrega el container al contenedor principal de bloques
    scene.blockContainer.add(container);
  
    // Se aplica el tinte de hover al bloque base
    applyHoverTint(ground, { originalTint: 0xffffff, hoverTint: 0xAAAAAA });
  }
  

export function getDepthForLayer(type: 'ground' | 'object' | 'character' | 'overlay', isoY: number): number {
  const base = isoY;
  switch (type) {
    case 'ground': return base - 10;
    case 'object': return base;
    case 'character': return base + 1;
    case 'overlay': return base + 1000;
    default: return base;
  }
}

export function getBlockContainerById(scene: IsoSceneContext, blockId: number): Phaser.GameObjects.Container | null {
  return scene.blockContainer.list.find(
    (child) => child instanceof Phaser.GameObjects.Container && child.getData('blockId') === blockId
  ) as Phaser.GameObjects.Container | null;
}

export function updateOverlaysNearBlock(scene: IsoSceneContext, centerBlockId: number, character: Phaser.GameObjects.Sprite, range: number = 5) {
  const centerBlock = scene.blockData.find(b => b.blockId === centerBlockId);
  if (!centerBlock) return;
  scene.blockData.forEach((block) => {
    const dx = Math.abs(block.x - centerBlock.x);
    const dy = Math.abs(block.y - centerBlock.y);
    const distance = dx + dy;
    if (distance > range) return;
    const container = scene.getBlockContainerById(block.blockId);
    if (!container) return;
    const overlay = container.getAt(1) as Phaser.GameObjects.Sprite;
    if (!overlay) return;
    const isBehind = character.y > overlay.y - overlay.displayHeight * overlay.originY;
    scene.tweens.add({ targets: overlay, alpha: isBehind ? 0.4 : 1, duration: 200, ease: 'Linear' });
  });
}

export async function fetchHistoricalPositions(scene: IsoSceneContext, url: string, tileWidth: number, tileHeight: number) {
  try {
    const response = await fetch(`${url}/blocks`);
    const data = await response.json();
    const blocks: BlockState[] = data.blocks;
    const validStatuses = ['defendido', 'redominio', 'vasallo'];
    blocks.forEach((blockState) => {
      if (!validStatuses.includes(blockState.status)) return;
      let controllingCharacter: number | null = null;
      if (blockState.status === 'defendido') controllingCharacter = Number(blockState.owner);
      else if (blockState.status === 'redominio') controllingCharacter = Number(blockState.lastOwner);
      else if (blockState.status === 'vasallo') controllingCharacter = Number(blockState.ally);
      if (!controllingCharacter) return;
      const block = scene.blockData.find((b) => b.blockId === Number(blockState.blockId));
      if (!block) return;
      const isoX = (block.x - block.y) * (tileWidth * 0.3);
      const isoY = (block.x + block.y) * (tileHeight * 0.3);
      let charSprites = scene.charactersMap.get(controllingCharacter);
      if (!charSprites) {
        charSprites = new Map();
        scene.charactersMap.set(controllingCharacter, charSprites);
      }
      const sprite = scene.add.sprite(isoX, isoY - 20, 'bunny').setOrigin(0.5, 1).setScale(0.5);
      sprite.play('idle');
      sprite.setDepth(isoY + 20);
      scene.updateOverlaysNearBlock(block.blockId, sprite);
      charSprites.set(block.blockId, sprite);
    });
  } catch (error) {
    console.error('Error al obtener bloques históricos:', error);
  }
}

export async function fetchBlockStatus(scene: IsoSceneContext, url: string) {
    try {
      const response = await fetch(`${url}/blocks`);
      const data = await response.json();
      const blocks: BlockState[] = data.blocks;
      blocks.forEach((blockState) => {
        const blockId = parseInt(blockState.blockId);
        // Se utiliza getBlockSpriteById para obtener correctamente el sprite
        const blockSprite = scene.getBlockSpriteById(blockId);
        if (blockSprite) {
          applyStatusTint(scene, blockSprite, blockState);
        }
      });
    } catch (error) {
      console.error('Error al obtener estado de bloques:', error);
    }
  }
  

export function applyStatusTint(scene: IsoSceneContext, sprite: Phaser.GameObjects.Sprite, blockState: BlockState) {
  let effectiveStatus = blockState.status;
  if (blockState.conquestEnd && scene.currentBlockNumber > 0 && scene.currentBlockNumber < Number(blockState.conquestEnd)) {
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




export function handleBlockConquestStarted(scene: IsoSceneContext, blockState: BlockState, tileWidth: number, tileHeight: number) {
    console.log('Iniciando handleBlockConquestStarted con blockState:', blockState);
    
    const validStatuses = ['defendido', 'redominio', 'vasallo'];
    if (!validStatuses.includes(blockState.status)) return;
    
    let controllingCharacter: number | null = null;
    if (blockState.status === 'defendido') controllingCharacter = Number(blockState.owner);
    else if (blockState.status === 'redominio') controllingCharacter = Number(blockState.lastOwner);
    else if (blockState.status === 'vasallo') controllingCharacter = Number(blockState.ally);
    if (!controllingCharacter) {
      console.warn('No se encontró controllingCharacter');
      return;
    }
    
    const block = scene.blockData.find((b) => b.blockId === Number(blockState.blockId));
    if (!block) {
      console.warn('No se encontró block para blockId:', blockState.blockId);
      return;
    }
    
    const isoX = (block.x - block.y) * (tileWidth * 0.3);
    const isoY = (block.x + block.y) * (tileHeight * 0.3);
    console.log('Coordenadas isométricas para el bloque:', { isoX, isoY });
    
    // Actualiza el tinte del bloque
    const blockSprite = scene.getBlockSpriteById ? scene.getBlockSpriteById(block.blockId) : undefined;
    if (blockSprite) {
      console.log('Actualizando tinte en blockSprite:', blockSprite);
      applyStatusTint(scene, blockSprite, blockState);
    }
    
    let charSprites = scene.charactersMap.get(controllingCharacter);
    if (!charSprites) {
      charSprites = new Map();
      scene.charactersMap.set(controllingCharacter, charSprites);
    }
    
    if (charSprites.has(block.blockId)) {
      const sprite = charSprites.get(block.blockId)!;
      console.log('Moviendo sprite existente del personaje:', sprite);
      scene.tweens.add({
        targets: sprite,
        x: isoX,
        y: isoY - 20,
        duration: 500,
        ease: 'Power1',
        onComplete: () => {
          scene.updateOverlaysNearBlock(block.blockId, sprite);
          console.log('Tween completado para sprite:', sprite);
        },
      });
    } else {
      const sprite = scene.add.sprite(isoX, isoY - 20, 'bunny').setOrigin(0.5, 1).setScale(0.5);
      console.log('Creando nuevo sprite para el personaje:', sprite);
      sprite.play('idle');
      sprite.setDepth(isoY + 20);
      scene.updateOverlaysNearBlock(block.blockId, sprite);
      charSprites.set(block.blockId, sprite);
    }
  }
  
  



  

  
