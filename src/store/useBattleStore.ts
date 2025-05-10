// src/store/useBattleStore.ts
import { create } from 'zustand';

export type Character = {
  id: string;
  name: string;
  hp: number;
  attack: number;
  specialAttack: number;
  defense: number;
  specialDefense: number;
  speed: number;
  weaponId: number;
  elementId: number;
};

interface BattleState {
  player1: Character[];
  player2: Character[];
  addCharacter: (player: 1|2, char: Character)=>void;
}

export const useBattleStore = create<BattleState>((set)=>({
  player1: [], player2: [],
  addCharacter:(player,char)=>set(state=>{
    const key = player===1?'player1':'player2';
    return { [key]: [...state[key], char] } as any;
  }),
}));
