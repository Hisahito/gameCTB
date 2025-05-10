// src/components/StatsPanel.tsx
import React from 'react';
import PanelContainer from './PanelContainer';
import { Attribute } from './Main';

interface StatsPanelProps {
  attributes: Attribute[];
}

// Mapeo de estadísticas: etiqueta mostrada y trait_type en metadata
const STATS: { label: string; trait: string }[] = [
  { label: 'HP', trait: 'Health' },
  { label: 'Attack', trait: 'Attack' },
  { label: 'Elemental Power', trait: 'SpAtk' },
  { label: 'Defense', trait: 'Defense' },
  { label: 'Elemental Defense', trait: 'SpDef' },
  { label: 'Speed', trait: 'Speed' },
];

const StatsPanel: React.FC<StatsPanelProps> = ({ attributes }) => {
  // Extraer Rank
  const rank = attributes.find(a => a.trait_type === 'Rank')?.value || 'Unknown';

  return (
    <PanelContainer>
      <div className="bg-gray-800 p-2 rounded mb-4 flex justify-between items-center text-white">
        <span className="font-semibold">
          Rank: <span className="text-yellow-400">{rank}</span>
        </span>
        <button className="bg-yellow-500 text-gray-900 px-3 py-1 rounded text-sm">
          Upgrade
        </button>
      </div>
      <div className="divide-y divide-gray-700 text-gray-200">
        {STATS.map((stat, i) => {
          const val = attributes.find(a => a.trait_type === stat.trait)?.value || '-';
          return (
            <div
              key={stat.trait}
              className={`flex justify-between px-2 py-1 ${i % 2 === 0 ? 'bg-gray-800' : ''}`}
            >
              <span>{stat.label}:</span>
              <span className="font-mono">{val}</span>
            </div>
          );
        })}
      </div>
    </PanelContainer>
  );
};

export default StatsPanel;






