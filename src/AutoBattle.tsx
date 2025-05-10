import React from 'react';
import { Sidebar } from './components/Sidebar';
import { BattleField } from './components/BattleField';

export const AutoBattle: React.FC = () => {
  return (
    <div className="h-screen flex">
      <Sidebar player={1} />
      <BattleField />
      <Sidebar player={2} />
    </div>
  );
};

