// src/components/BlockCounter.tsx
import React, { useState, useEffect } from 'react';
import GameStateManager from '../managers/GameStateManager';

const BlockCounter: React.FC = () => {
  const [blockNumber, setBlockNumber] = useState<string>('Cargando...');

  useEffect(() => {
    const handleBlockNumber = (newBlockNumber: string) => {
   
      setBlockNumber(newBlockNumber);
    };

    // Suscribirse al evento 'blockNumber'
    GameStateManager.on('blockNumber', handleBlockNumber);

    // Limpiar la suscripción al desmontar el componente
    return () => {
      GameStateManager.off('blockNumber', handleBlockNumber);
    };
  }, []);

  return (
    <div>
      <h2>Número de Bloque Actual</h2>
      <p>{blockNumber}</p>
    </div>
  );
};

export default BlockCounter;
