import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useCharacterStore } from '../../store/useCharacterStore';
import characterAbi from '../../abi/Characters.json';
import { useGameSelection } from '../../context/GameSelectionContext';
import { useGlobalPositions } from '../../context/GlobalPositionsContext';

export const CharacterStatsFetcher = () => {
  const { selectedBlock } = useGameSelection();
  const { positions } = useGlobalPositions();
  const setStats = useCharacterStore((state) => state.setSelectedCharacterStats);

  // Buscar tokenId del personaje en el bloque seleccionado
  const tokenId = selectedBlock
    ? positions.find((p) => Number(p.cellId) === selectedBlock.blockId)?.tokenId
    : null;

    console.log('[Fetcher] selectedBlock:', selectedBlock);
console.log('[Fetcher] tokenId encontrado en posiciones:', tokenId);


  const { data: statsData, isSuccess } = useReadContract({
    address: '0x75F550d3C06961411aDAAAbd4a352218B9f4eeD9',
    abi: characterAbi,
    functionName: 'getStats',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  useEffect(() => {
    if (isSuccess && statsData && tokenId) {
      const stats = (statsData as bigint[]).map(Number);

      // Guardamos en Zustand
      setStats(tokenId, stats);

   
      console.log('[Fetcher] Stats recibidas de contrato para token', tokenId, stats);


      // Disparamos evento para Phaser
      window.dispatchEvent(
        new CustomEvent('characterStatsFetched', {
            detail: { tokenId, stats, blockId: selectedBlock?.blockId },
        })
      );
    }
  }, [isSuccess, statsData, tokenId]);

  return null; // No renderiza nada
};