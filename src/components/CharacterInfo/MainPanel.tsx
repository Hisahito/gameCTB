import React from 'react';
import PanelContainer from './PanelContainer';
import { Attribute } from './Main';

interface MainPanelProps {
  name: string;
  imageUrl: string;
  attributes: Attribute[];
}

const MainPanel: React.FC<MainPanelProps> = ({ name, imageUrl, attributes }) => {
  // Extraer datos clave de atributos
  const levelAttr = attributes.find(a => a.trait_type === 'Level');
  const healthAttr = attributes.find(a => a.trait_type === 'Health');
  const maxHealthAttr = attributes.find(a => a.trait_type === 'Health PP');
  const elementAttr = attributes.find(a => a.trait_type === 'Element');
  const weaponAttr = attributes.find(a => a.trait_type === 'Weapon');

  // Calcular porcentaje de vida
  const currentHP = parseInt(healthAttr?.value || '0', 10);
  const maxHP = parseInt(maxHealthAttr?.value || '1', 10);
  const hpPercent = maxHP > 0 ? Math.min(100, Math.floor((currentHP / maxHP) * 100)) : 0;

  return (
    <PanelContainer>
      {/* Iconos de elemento y arma */}
      <div className="flex justify-end space-x-2 mb-2 text-white">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          {elementAttr?.value || '?'}
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          {weaponAttr?.value || '?'}
        </div>
      </div>
      {/* Imagen y nombre */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-32 object-contain rounded mb-2"
        />
      )}
      <h3 className="text-lg font-bold mb-1 text-white">{name}</h3>
      {/* Barra de vida */}
      <span>HP:</span>
      <div className="w-full bg-gray-700 rounded-full h-4 mb-2 overflow-hidden">
        
        <div
          className="h-full bg-red-500"
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="flex justify-between items-center mb-4 text-sm text-white">
        <span>LV: {levelAttr?.value || '-'}</span>
        <button className="bg-green-600 text-white px-2 py-1 rounded text-sm">
          Level Up
        </button>
      </div>
    </PanelContainer>
  );
};

export default MainPanel;


