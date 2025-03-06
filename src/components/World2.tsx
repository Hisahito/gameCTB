import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import abi from '../abi/TimeMachine.json';

import castilloImg from '../assets/castillo.png';
import cofreImg from '../assets/cofre.png';
import grassImg from '../assets/pasto3.png';
import aguaImg from '../assets/water.png';
import bosqueImg from '../assets/bosque.png';
import piedraImg from '../assets/piedra1.png';
import woodsImg from '../assets/blockWoods.png';
import soldierIdle from '../assets/Soldier-Idle.png'; // Sprite del personaje
import rockImg from '../assets/BlockRock1.png';
import nightImg from '../assets/NightBlock1.png';
import chestImg from '../assets/GrassChest.png';
import grass2Img from '../assets/Grass2.png';
import grass3Img from '../assets/Grass3.png';

import woods1Img from '../assets/Woods1.png';
import woods2Img from '../assets/Woods2.png';

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
    }
    window.addEventListener('blockSelected', handleBlockSelected as EventListener);
    return () => {
      window.removeEventListener('blockSelected', handleBlockSelected as EventListener);
    }
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
        this.load.image('castillo', castilloImg);
        this.load.image('cofre', bosqueImg);
        this.load.image('torre', grassImg);
        this.load.image('pasto', grassImg);
        this.load.image('grass2', grass2Img);
        this.load.image('grass3', grass3Img);
        this.load.image('ngrass', nightImg);
        this.load.image('agua', aguaImg);
        this.load.image('bosque', woodsImg);
        this.load.image('piedra', rockImg);
        this.load.image('woods', woodsImg);
        this.load.image('woods1', woods1Img);
        this.load.image('woods2', woods2Img);
        this.load.image('gchest', chestImg);

        // Cargar el JSON del mapa y de personajes
        this.load.json('world', 'Canonical.json');
        this.load.json('characters', 'Characters.json');

        // Cargar el sprite sheet del personaje (6 frames de 100x100)
        this.load.spritesheet('soldierIdle', soldierIdle, { frameWidth: 100, frameHeight: 100 });
      }

      create() {
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
          repeat: -1
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
        window.addEventListener("wheel", wheelHandler);
        this.events.on("destroy", () => {
          window.removeEventListener("wheel", wheelHandler);
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


        // Definición de texturas default y sus probabilidades
  const defaultTextures = [
    { key: 'pasto', probability: 0.85 },
    { key: 'grass2', probability: 0.1 },
    { key: 'grass3', probability: 0.05 },
  ];

  const woodsTextures = [
    { key: 'woods1', probability: 0.7 },
    { key: 'woods1', probability: 0.2 },
    { key: 'woods2', probability: 0.1 },
  ];

  // Función determinista que genera un número aleatorio entre 0 y 1 a partir de una semilla
  function randomFromSeed(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Función para escoger una textura de forma determinista según las probabilidades y una semilla
  function getDeterministicTexture(textures, seed) {
    const totalProbability = textures.reduce((acc, curr) => acc + curr.probability, 0);
    const random = randomFromSeed(seed) * totalProbability;
    let sum = 0;
    for (let texture of textures) {
      sum += texture.probability;
      if (random < sum) {
        return texture.key;
      }
    }
    return textures[0].key; // fallback
  }

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


    // Si ninguna condición especial se cumple, asignar la textura default de forma determinista
    if (!texture) {
      // Usamos blockId como semilla para mantener la misma asignación en cada recarga
      texture = getDeterministicTexture(defaultTextures, block.blockId);
    }


          const sprite = this.add.sprite(isoX, isoY, texture).setOrigin(0.5, 1);
          // Guardamos el blockId en el sprite para usarlo después
          sprite.setData("blockId", block.blockId);

          // Definir área interactiva en forma de rombo para detectar clicks
          const hitArea = new Phaser.Geom.Polygon([
            new Phaser.Geom.Point(sprite.width / 2, sprite.height - tileHeight),
            new Phaser.Geom.Point(sprite.width / 2 + tileWidth / 2, sprite.height - tileHeight / 2),
            new Phaser.Geom.Point(sprite.width / 2, sprite.height),
            new Phaser.Geom.Point(sprite.width / 2 - tileWidth / 2, sprite.height - tileHeight / 2)
          ]);
          sprite.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);

          sprite.on('pointerdown', () => {
            // Si ya está seleccionado, no hacemos nada
            if (this.selectedBlock === sprite) return;

            // Si hay un bloque previamente seleccionado, regresamos su posición original y la del personaje asociado
            if (this.selectedBlock) {
              this.tweens.add({
                targets: this.selectedBlock,
                y: this.selectedBlock.y + 10,
                duration: 200,
                ease: 'Power1'
              });
              const prevBlockId = this.selectedBlock.getData("blockId");
              const prevSoldier = this.charactersMap.get(prevBlockId);
              if (prevSoldier) {
                this.tweens.add({
                  targets: prevSoldier,
                  y: prevSoldier.y + 10,
                  duration: 200,
                  ease: 'Power1'
                });
              }
            }

            // Animar el bloque clickeado: se sube 10px
            this.tweens.add({
              targets: sprite,
              y: sprite.y - 10,
              duration: 200,
              ease: 'Power1'
            });
            // Animar también el sprite del personaje asociado, si existe
            const blockId = sprite.getData("blockId");
            const soldier = this.charactersMap.get(blockId);
            if (soldier) {
              this.tweens.add({
                targets: soldier,
                y: soldier.y - 10,
                duration: 200,
                ease: 'Power1'
              });
            }
            this.selectedBlock = sprite;

            // Disparar un CustomEvent para notificar a React del bloque seleccionado
            window.dispatchEvent(new CustomEvent('blockSelected', { detail: { blockId } }));

            // Mostrar tooltip
            if (this.tooltip) this.tooltip.destroy();
            const isoX = sprite.x;
            const isoY = sprite.y;
            this.tooltip = this.add.container(isoX + 50, isoY - 40);
            const bg = this.add.graphics();
            bg.fillStyle(0x000000, 0.8);
            bg.fillRoundedRect(0, 0, 200, 60, 10);
            const text = this.add.text(10, 10, `ID: ${sprite.getData("blockId")}\nSupply: ${block.supplyBlock}`, {
              fontSize: '12px',
              color: '#ffffff',
            });
            this.tooltip.add([bg, text]);
            this.add.existing(this.tooltip);
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

        // Para cada personaje, se busca el bloque correspondiente y se añade el sprite del personaje
        this.charactersData.forEach((character: Character) => {
          const block = this.blockData.find(b => b.blockId === character.blockId);
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
      {showForm && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -20%)',
          background: '#fff',
          padding: '20px',
          border: '1px solid #000',
          borderRadius: '8px',
          zIndex: 10
        }}>
          {/* Botón para cerrar el formulario */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { 
              console.log("Cerrando formulario");
              setShowForm(false); 
            }}>X</button>
          </div>
          <form onSubmit={submit}>
            <div>
              <label><strong>Block ID:</strong> {selectedBlockId}</label>
            </div>
            <div>
              <label>
                Character ID:
                <input
                  type="number"
                  name="characterId"
                  value={characterId}
                  onChange={(e) => setCharacterId(e.target.value)}
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Defender:
                <input
                  type="checkbox"
                  name="defender"
                  checked={defender}
                  onChange={(e) => setDefender(e.target.checked)}
                />
              </label>
            </div>
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}
      {isConfirming && (
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#000',
          color: '#fff',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 10
        }}>
          Esperando transacción...
        </div>
      )}
      {isConfirmed && (
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'green',
          color: '#fff',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 10
        }}>
          Transacción confirmada!
        </div>
      )}
    </div>
  );
};

export default MapCanvas2;
