// src/components/UI/SendHabilityForm.tsx
import React, { useState, useEffect } from 'react';
import { useGameSelection } from '../../context/GameSelectionContext';
import { useGlobalPositions } from '../../context/GlobalPositionsContext';
import MyNftCards from '../NFT/MyNftCards';

const SendHabilityForm: React.FC = () => {
  const { selectedBlock, selectedAbilityId, setSelectedAbilityId } = useGameSelection();
  const { positions } = useGlobalPositions();

  const [blockHasCharacter, setBlockHasCharacter] = useState(false);
  const [targetTokenId, setTargetTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBlock) {
      setBlockHasCharacter(false);
      setTargetTokenId(null);
      return;
    }

    const found = positions.find((p) => p.cellId === selectedBlock.blockId.toString());
    if (found) {
      setBlockHasCharacter(true);
      setTargetTokenId(found.tokenId);
    } else {
      setBlockHasCharacter(false);
      setTargetTokenId(null);
    }
  }, [selectedBlock, positions]);

  const handleSend = () => {
    if (!selectedBlock || !selectedAbilityId || !targetTokenId) return;
    console.log(`Usando habilidad ${selectedAbilityId} sobre personaje ${targetTokenId} en bloque ${selectedBlock.blockId}`);
    // Aquí va la transacción o lógica real
  };

  if (!selectedBlock || !blockHasCharacter) return null;

  return (
    <div
      className="fixed bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border w-fit flex flex-col gap-2 z-50 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-700">
          Habilidad sobre bloque #{selectedBlock.blockId}
        </span>
        <button onClick={() => setSelectedAbilityId('')} className="ml-2 text-gray-500 hover:text-black font-bold">&times;</button>
      </div>
      <input
        type="text"
        value={selectedAbilityId}
        onChange={(e) => setSelectedAbilityId(e.target.value)}
        placeholder="ID habilidad"
        className="border p-1 rounded w-32 text-black"
      />
      <button
        onClick={handleSend}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
      >
        Enviar
      </button>

      <div className="max-h-64 overflow-y-auto">
        <MyNftCards filterContract='0x8BA348B66Db64A58C8809eC613Fa9961e67f66d5' showOnlyAbilities compactView />
      </div>
    </div>
  );
};

export default SendHabilityForm;

