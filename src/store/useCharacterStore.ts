// src/store/useCharacterStore.ts
import { create } from 'zustand';

interface CharacterStore {
  selectedCharacterId: string | null;
  selectedStats: number[] | null;
  setSelectedCharacterStats: (tokenId: string, stats: number[]) => void;
  clearSelectedCharacter: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  selectedCharacterId: null,
  selectedStats: null,

  setSelectedCharacterStats: (tokenId, stats) => set({
    selectedCharacterId: tokenId,
    selectedStats: stats,
  }),

  clearSelectedCharacter: () => set({
    selectedCharacterId: null,
    selectedStats: null,
  })
}));
