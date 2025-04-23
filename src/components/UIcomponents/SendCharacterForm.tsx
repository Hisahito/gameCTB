import React, { useContext, useState } from 'react';
import { useGameSelection} from '../../context/GameSelectionContext';
import MyNftCards from '../NFT/MyNftCards';
import { useWriteContract, useReadContract } from 'wagmi';
import abi from '../../abi/GridMap.json';

const SendCharacterForm: React.FC = () => {
  const { selectedBlock, setSelectedBlock,characterId,setCharacterId } = useGameSelection();
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  

  const handleSend = () => {
    if (!selectedBlock || !characterId) return;
    console.log(`Enviando personaje ${characterId} al bloque ${selectedBlock.blockId}`);
    // Aquí iría tu lógica de transacción
    writeContract({
          address: '0xd38092C42F7BeEE20c6E7ccA25c058119e49B245',
          abi,
          functionName: 'moveCharacter',
          args: [BigInt(characterId), BigInt(selectedBlock.blockId)],
        });

  };

  if (!selectedBlock) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className=" overflow-y-auto fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg border w-80 z-50"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-black">
          Bloque #{selectedBlock.blockId}
        </h3>
        <button
          onClick={() => setSelectedBlock(null)}
          className="text-gray-500 hover:text-black text-xl font-bold"
        >
          &times;
        </button>
      </div>

      <label className="text-sm text-gray-700">ID del personaje:</label>
      <input
        type="text"
        value={characterId}
        onChange={(e) => setCharacterId(e.target.value)}
        placeholder="Ej. 123"
        className="w-full mt-1 mb-4 p-2 border rounded text-black"
      />
      <button
        onClick={handleSend}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
      >
        Enviar
      </button>
      <div className='mt-4 max-h-128 overflow-y-auto pr-2'>
      <MyNftCards filterContract='0x75F550d3C06961411aDAAAbd4a352218B9f4eeD9' compactView/>
      </div>
    </div>
    
    
  );
};

export default SendCharacterForm;

