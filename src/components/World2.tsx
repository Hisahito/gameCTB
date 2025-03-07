// src/components/MapCanvas2.tsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import abi from '../abi/TimeMachine.json';
import { randomFromSeed, getDeterministicTexture } from '../utils/textureUtils';
import { createTooltip } from '../utils/uiHelpers';
import images from '../assets';
import BlockForm from '../components/BlockForm';
import GameStateManager, { BlockConquestStartedEvent } from '../managers/GameStateManager';

interface Block {
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
      // Mapa para asociar cada characterId con su sprite de personaje
      private charactersMap: Map<number, Phaser.GameObjects.Sprite> = new Map();
      private camera!: Phaser.Cameras.Scene2D.Camera;
      private selectedBlock: Phaser.GameObjects.Sprite | null = null;
      private tooltip: Phaser.GameObjects.Container | null = null;
      private highlight!: Phaser.GameObjects.Graphics;

      preload() {
        // Cargar imágenes y assets
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

        this.renderBlocks();
        // Ya no se carga Characters.json, se usará el histórico desde el backend
        this.fetchHistoricalPositions();

        // Suscribirse a los eventos en tiempo real a través del GameStateManager
        GameStateManager.on('blockConquestStarted', (newEvent: BlockConquestStartedEvent) => {
          this.handleBlockConquestStarted(newEvent);
        });
      }

      renderBlocks() {
        const defaultTextures = [
          { key: 'pasto', probability: 0.85 },
          { key: 'grass2', probability: 0.1 },
          { key: 'grass3', probability: 0.05 },
        ];

        const woodsTextures = [
          { key: 'woods3', probability: 0.5 },
          { key: 'woods2', probability: 0.4 },
          { key: 'woods1', probability: 0.1 },
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

      async fetchHistoricalPositions() {
        try {
          const response = await fetch(`${BACKEND_URL}/positions`);
          const data = await response.json();
          // Se espera que el endpoint retorne un objeto { positions: { [characterId]: event } }
          const positions = data.positions;
          for (const key in positions) {
            const event = positions[key];
            const characterId = Number(event.args.characterId);
            const newBlockId = Number(event.args.blockId);
            // Buscar el bloque correspondiente en blockData
            const block = this.blockData.find((b) => b.blockId === newBlockId);
            if (block) {
              const isoX = (block.x - block.y) * (tileWidth * 0.3);
              const isoY = (block.x + block.y) * (tileHeight * 0.3);
              let sprite = this.charactersMap.get(characterId);
              if (!sprite) {
                // Crear el sprite si no existe aún
                sprite = this.add.sprite(isoX, isoY + 20, 'soldierIdle').setOrigin(0.5, 1);
                sprite.play('idle');
                sprite.setDepth(isoY + 20);
                this.charactersMap.set(characterId, sprite);
              } else {
                // Actualizar posición sin animación para el histórico
                sprite.x = isoX;
                sprite.y = isoY + 20;
              }
            }
          }
        } catch (error) {
          console.error('Error al obtener posiciones históricas:', error);
        }
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
      
      

      shutdown() {
        GameStateManager.off('blockConquestStarted', this.handleBlockConquestStarted, this);
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
    </div>
  );
};

export default MapCanvas2;



