// src/components/BlocksList.tsx
import React, { useState, useEffect } from 'react';
import GameStateManager, { BlockState } from '../managers/GameStateManager';

interface Block {
  blockId: string;
  status: string;
  owner: string | null;
  conquestEnd: string | null;
  futureOwner?: string | null;
  lastOwner?: string | null;
  ally?: string | null;
  originalOwner?: string | null;
}

const BlocksList: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de bloques desde el backend
  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/blocks');
        if (!response.ok) {
          throw new Error('Error en la respuesta de la red');
        }
        const data = await response.json();
        setBlocks(data.blocks);
      } catch (err: any) {
        console.error('Error fetching blocks:', err);
        setError(err.message || 'Error al obtener bloques');
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  // Suscribirse a los eventos en tiempo real para actualizar la lista
  useEffect(() => {
    const handleBlockUpdated = (updatedBlock: Block) => {
      setBlocks(prevBlocks => {
        const index = prevBlocks.findIndex(block => block.blockId === updatedBlock.blockId);
        if (index !== -1) {
          // Actualiza el bloque existente
          const newBlocks = [...prevBlocks];
          newBlocks[index] = updatedBlock;
          return newBlocks;
        }
        // Agrega un nuevo bloque si no estaba presente
        return [...prevBlocks, updatedBlock];
      });
    };

    GameStateManager.on('blockUpdated', handleBlockUpdated);
    return () => {
      GameStateManager.off('blockUpdated', handleBlockUpdated);
    };
  }, []);

  if (loading) {
    return <div>Cargando bloques...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (blocks.length === 0) {
    return <div>No se encontraron bloques.</div>;
  }

  return (
    <div>
      <h2>Lista de Bloques</h2>
      <ul>
        {blocks.map((block: Block) => (
          <li key={block.blockId} style={{ marginBottom: '1rem' }}>
            <p><strong>Block ID:</strong> {block.blockId}</p>
            <p><strong>Status:</strong> {block.status}</p>
            <p><strong>Owner:</strong> {block.owner || 'N/A'}</p>
            <p><strong>Conquest End:</strong> {block.conquestEnd || 'N/A'}</p>
            {block.futureOwner && <p><strong>Future Owner:</strong> {block.futureOwner}</p>}
            {block.lastOwner && <p><strong>Last Owner:</strong> {block.lastOwner}</p>}
            {block.ally && <p><strong>Ally:</strong> {block.ally}</p>}
            {block.originalOwner && <p><strong>Original Owner:</strong> {block.originalOwner}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlocksList;

