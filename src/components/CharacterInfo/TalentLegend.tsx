import React from 'react';
import PanelContainer from './PanelContainer';

 const TalentLegend: React.FC = () => (
  <PanelContainer>
    <h4 className="text-white font-semibold mb-2">Talentos / Normal / Debilidad</h4>
    <div className="flex justify-between items-center">
      {[
        { label: 'Talento', color: 'bg-green-500', modifier: '+1' },
        { label: 'Normal',  color: 'bg-yellow-500', modifier: '0' },
        { label: 'Debilidad', color: 'bg-red-500', modifier: '−1' },
      ].map(({ label, color, modifier }) => (
        <div key={label} className="flex flex-col items-center">
          <div className={`${color} w-8 h-8 rounded-full mb-1`} />
          <span className="text-white text-sm">{label}</span>
          <span className="text-gray-300 text-xs">{modifier} a la Cara</span>
        </div>
      ))}
    </div>
  </PanelContainer>
);

export default TalentLegend;