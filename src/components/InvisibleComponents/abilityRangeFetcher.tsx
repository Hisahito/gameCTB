// src/components/GameLogic/AbilityRangeFetcher.tsx
import { useEffect } from 'react';
import { useGameSelection } from '../../context/GameSelectionContext';
import { useGlobalPositions } from '../../context/GlobalPositionsContext';
import { useReadContract } from 'wagmi';
import abilityAbi from '../../abi/AbilityNFT.json';

const ABILITY_CONTRACT = '0x8ba348b66db64a58c8809ec613fa9961e67f66d5';

const AbilityRangeFetcher = () => {
  const { selectedAbilityId, selectedBlock } = useGameSelection();
  const { positions } = useGlobalPositions();

  const defIdCall = useReadContract({
    address: ABILITY_CONTRACT,
    abi: abilityAbi,
    functionName: 'getDefId',
    args: selectedAbilityId ? [BigInt(selectedAbilityId)] : undefined,
  });

  const coordinatesCall = useReadContract({
    address: ABILITY_CONTRACT,
    abi: abilityAbi,
    functionName: 'getCoordinates',
    args: defIdCall.data ? [defIdCall.data] : undefined,
  });

  useEffect(() => {
    if (!coordinatesCall.data || !selectedBlock) return;

    // Confirmar que hay un personaje en el bloque seleccionado
    const hasCharacter = positions.some(
      (pos) => pos.cellId === selectedBlock.blockId.toString()
    );
    if (!hasCharacter) return;

    const [xs, ys] = coordinatesCall.data as [number[], number[]];
    const affectedBlocks = xs.map((dx, i) => {
      const dy = ys[i];
      return {
        x: selectedBlock.x + dx,
        y: selectedBlock.y + dy,
      };
    });

    console.log('🧠 Coordenadas obtenidas:', { xs, ys });
    console.log('🟥 Bloques afectados calculados:', affectedBlocks);
    console.log('📦 Emitiendo renderAbilityRange con origen:', selectedBlock);

    window.dispatchEvent(new CustomEvent('renderAbilityRange', {
      detail: { origin: selectedBlock, affectedBlocks },
    }));
  }, [coordinatesCall.data, selectedBlock, positions]);

  useEffect(() => {
    console.log('🔄 selectedAbilityId:', selectedAbilityId);
    console.log('📍 selectedBlock:', selectedBlock);
    console.log('📄 defIdCall:', defIdCall.data);
    console.log('📐 coordinatesCall:', coordinatesCall.data);
  }, [selectedAbilityId, selectedBlock, defIdCall.data, coordinatesCall.data]);

  return null;
};

export default AbilityRangeFetcher;



