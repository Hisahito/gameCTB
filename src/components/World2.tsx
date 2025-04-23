// src/components/MapCanvas2.tsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import abi from '../abi/TimeMachine.json';
import BlockForm from '../components/BlockForm';
import IsoScene from '../scenes/IsoScene';

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
      address: '0x6A04F6C5dbd2eb417aEF84982a76509BEB5ec85d',
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

    const phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
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




