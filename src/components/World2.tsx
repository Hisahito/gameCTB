import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import abi from '../abi/TimeMachine.json';
import { randomFromSeed, getDeterministicTexture } from '../utils/textureUtils';
import { createTooltip } from '../utils/uiHelpers';
import images from '../assets';
import BlockForm from '../components/BlockForm'; // Importamos el formulario
import GameStateManager from '../managers/GameStateManager';

interface Block {
  blockId: number;
  x: number;
  y: number;
  category: string;
  supplyBlock: number;
  afinity: number[];
  only: number;
}

interface Character {
  characterId: number;
  blockId: number;
}

const tileWidth = 64;
const tileHeight = 32;

const MapCanvas2: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  // Estados para la interacción del formulario
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [characterId, setCharacterId] = useState<string>('');
  const [defender, setDefender] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Hooks de wagmi para ejecutar la transacción
  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Función submit que se dispara al enviar el formulario
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBlockId) return;
    writeContract({
      address: '0x322AE0BEE905572DE3d1F67E2A560c19fbc76994',
      abi,
      functionName: 'conquest',
      args: [BigInt(characterId), BigInt(selectedBlockId), defender],
    });
    setShowForm(false);
  }

  // Escucha el CustomEvent que dispara Phaser al seleccionar un bloque
  useEffect(() => {
    const handleBlockSelected = (e: CustomEvent<{ blockId: number }>) => {
      setSelectedBlockId(e.detail.blockId);
      setShowForm(true);
    };
    window.addEventListener('blockSelected', handleBlockSelected as EventListener);
    return () => {
      window.removeEventListener('blockSelected', handleBlockSelected as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    class IsoScene extends Phaser.Scene {
      private blockData: Block[] = [];
      private charactersData: Character[] = [];
      // Mapa para asociar cada blockId con su sprite de personaje
      private charactersMap: Map<number, Phaser.GameObjects.Sprite> = new Map();
      private camera!: Phaser.Cameras.Scene2D.Camera;
      private selectedBlock: Phaser.GameObjects.Sprite | null = null;
      private tooltip: Phaser.GameObjects.Container | null = null;
      private highlight!: Phaser.GameObjects.Graphics;

      preload() {
        this.load.image('castillo', images.castillo);
        this.load.image('cofre', images.cofre);
        this.load.image('torre', images.pasto);
        this.load.image('pasto', images.pasto);
        this.load.image('grass2', images.grass2);
        this.load.image('grass3', images.grass3);
        this.load.image('ngrass', images.nightBlock);
        this.load.image('agua', images.agua);
        this.load.image('bosque', images.bosque);
        this.load.image('piedra', images.piedra);
        this.load.image('woods', images.blockWoods);
        this.load.image('woods1', images.woods1);
        this.load.image('woods2', images.woods2);
        this.load.image('woods3', images.woods3);
        this.load.image('gchest', images.cofre);

        // Cargar el JSON del mapa y de personajes
        this.load.json('world', 'Canonical.json');
        this.load.json('characters', 'Characters.json');

        // Cargar el sprite sheet del personaje (6 frames de 100x100)
        this.load.spritesheet('soldierIdle', images.soldierIdle, { frameWidth: 100, frameHeight: 100 });
      }

      create() {
        // Deshabilitar menú contextual
        this.input.mouse?.disableContextMenu();

        this.blockData = this.cache.json.get('world');
        this.charactersData = this.cache.json.get('characters');

        this.camera = this.cameras.main;
        this.camera.setZoom(1);
        this.camera.setBounds(-3000, -3000, 6000, 6000);
        this.camera.centerOn(0, 0);

        // Crear animación idle para el personaje
        this.anims.create({
          key: 'idle',
          frames: this.anims.generateFrameNumbers('soldierIdle', { start: 0, end: 5 }),
          frameRate: 6,
          repeat: -1,
        });

        // Movimiento con el mouse (drag)
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
          if (pointer.isDown) {
            this.camera.scrollX -= pointer.velocity.x / 5;
            this.camera.scrollY -= pointer.velocity.y / 5;
          }
        });

        // Evento de zoom con la rueda del mouse
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

        // Crear contorno en forma de rombo
        this.highlight = this.add.graphics();
        this.highlight.lineStyle(3, 0xffff00);
        this.highlight.visible = false;
        this.add.existing(this.highlight);

        // Renderizar bloques y personajes
        this.renderBlocks();
        this.renderCharacters();
      }

      renderBlocks() {
        const defaultTextures = [
          { key: 'pasto', probability: 0.85 },
          { key: 'grass2', probability: 0.1 },
          { key: 'grass3', probability: 0.05 },
        ];

        const woodsTextures = [
          { key: 'woods3', probability: 0.5 },
          { key: 'woods2', probability: 0.3 },
          { key: 'woods1', probability: 0.2 },
        ];

        const container = this.add.container();
        const spacingFactorX = 0.3;
        const spacingFactorY = 0.3;

        this.blockData.forEach((block) => {
          const { x, y, category, only } = block;
          const isoX = (x - y) * (tileWidth * spacingFactorX);
          const isoY = (x + y) * (tileHeight * spacingFactorY);

          let texture = null;
          if (category === 'Special Cluster 1') texture = 'agua';
          if (category === 'Special Cluster 2') texture = 'piedra';
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
              // Notificar a React que se ha seleccionado el bloque
              window.dispatchEvent(new CustomEvent('blockSelected', { detail: { blockId } }));
            }

            if (this.tooltip) this.tooltip.destroy();
            this.tooltip = createTooltip(this, sprite, block);
          });

          sprite.on('pointerover', () => {
            sprite.setTint(0xffff00);
          });
          sprite.on('pointerout', () => {
            sprite.clearTint();
          });

          container.add(sprite);
        });
      }

      renderCharacters() {
        const spacingFactorX = 0.3;
        const spacingFactorY = 0.3;

        this.charactersData.forEach((character: Character) => {
          const block = this.blockData.find((b) => b.blockId === character.blockId);
          if (!block) return;

          const isoX = (block.x - block.y) * (tileWidth * spacingFactorX);
          const isoY = (block.x + block.y) * (tileHeight * spacingFactorY);
          const posX = isoX;
          const posY = isoY + 20;

          const soldier = this.add.sprite(posX, posY, 'soldierIdle').setOrigin(0.5, 1);
          soldier.play('idle');
          soldier.setDepth(posY);

          this.charactersMap.set(block.blockId, soldier);
        });
      }
    }

    const phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1200,
      height: 800,
      backgroundColor: '#87CEEB',
      parent: gameContainerRef.current!,
      scene: IsoScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: true,
      },
      physics: {
        default: 'arcade',
      },
    });

    setGame(phaserGame);

    return () => {
      phaserGame.destroy(true);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={gameContainerRef} />
      {showForm && selectedBlockId && (
        <BlockForm
          blockId={selectedBlockId}
          characterId={characterId}
          defender={defender}
          onChangeCharacterId={setCharacterId}
          onChangeDefender={setDefender}
          onSubmit={submit}
          onClose={() => setShowForm(false)}
        />
      )}
      {isConfirming && (
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#000',
            color: '#fff',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 10,
          }}
        >
          Esperando transacción...
        </div>
      )}
      {isConfirmed && (
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'green',
            color: '#fff',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 10,
          }}
        >
          Transacción confirmada!
        </div>
      )}
    </div>
  );
};

export default MapCanvas2;

