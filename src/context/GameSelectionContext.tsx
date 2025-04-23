// src/context/GameSelectionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Block {
  blockId: number;
  x: number;
  y: number;
}

interface GameSelectionContextType {
  selectedBlock: Block | null;
  setSelectedBlock: (block: Block | null) => void;
  characterId: string;
  setCharacterId: (id: string) => void;
  selectedAbilityId: string;
  setSelectedAbilityId: (id: string) => void;
}

const GameSelectionContext = createContext<GameSelectionContextType>({
  selectedBlock: null,
  setSelectedBlock: () => {},
  characterId: '',
  setCharacterId: () => {},
  selectedAbilityId: '',
  setSelectedAbilityId: () => {},
});

export const GameSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [characterId, setCharacterId] = useState('');
  const [selectedAbilityId, setSelectedAbilityId] = useState('');

  useEffect(() => {
    const handler = (e: CustomEvent<Block>) => setSelectedBlock(e.detail);
    window.addEventListener('blockSelected', handler as EventListener);
    return () => window.removeEventListener('blockSelected', handler as EventListener);
  }, []);

  return (
    <GameSelectionContext.Provider
      value={{
        selectedBlock,
        setSelectedBlock,
        characterId,
        setCharacterId,
        selectedAbilityId,
        setSelectedAbilityId,
      }}
    >
      {children}
    </GameSelectionContext.Provider>
  );
};

export const useGameSelection = () => useContext(GameSelectionContext);


