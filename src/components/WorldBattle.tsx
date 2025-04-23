// src/components/MapViewer.tsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import IsoScene from '../scenes/BattleScene2';
import { useGlobalPositions } from '../context/GlobalPositionsContext';

const WorldBattle: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { positions } = useGlobalPositions(); // Hook del contexto

  // 1. Inicialización de Phaser
  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: containerRef.current,
      scene: [IsoScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: '#1e1e1e',
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // 2. Notificar a Phaser cuando cambian las posiciones (inicial o realtime)
  useEffect(() => {
    if (positions.length > 0) {
      window.dispatchEvent(new CustomEvent('renderCharacters', { detail: { positions } }));
    }
  }, [positions]);

  return <div ref={containerRef} className="w-full h-screen" />;
};

export default WorldBattle;

