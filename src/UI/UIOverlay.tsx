// UIOverlay.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UIOverlay.css';
import { useContext } from 'react';
import { useGameSelection } from '../context/GameSelectionContext';

import Characters from '../components/Characters';
import TowerPanel from './TowerPanel';
import PJSelector from './CharacterActive/PJSelector';

const UIOverlay = () => {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const { selectedBlock } = useGameSelection();

  // Estado global de selección
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]); // characterId[]
  
  const handleCharacterToggle = (characterId: string) => {
    setSelectedCharacters((prev) => {
      if (prev.includes(characterId)) {
        // Deseleccionar
        return prev.filter((id) => id !== characterId);
      } else {
        // Seleccionar nuevo
        return [...prev, characterId];
      }
    });
  };

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'bosque':
        return <TowerPanel />;
      case 'character':
        return <Characters selectedCharacters={selectedCharacters} onToggleCharacter={handleCharacterToggle} />;
      default:
        return null;
    }
  };

  return (
    <>
<div className='son'>
<TowerPanel />
</div>


      <div className="side-menu">
      

        <img
          src="src/assets/coneja.png"
          alt="Bosque"
          onClick={() => setActivePanel('bosque')}
          className="menu-icon"
        />
        <img
          src="src/assets/Grass2.png"
          alt="character"
          onClick={() => setActivePanel('character')}
          className="menu-icon"
        />
      </div>

      <PJSelector selectedCharacters={selectedCharacters} />

      <AnimatePresence>
        {activePanel && (
          <motion.div
            className="popup-panel"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button className="close-btn" onClick={() => setActivePanel(null)}>X</button>
            {renderPanelContent()}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 bg-black text-white p-2 rounded">
      {selectedBlock ? (
        <>
          <div><strong>ID:</strong> {selectedBlock.blockId}</div>
          <div><strong>X:</strong> {selectedBlock.x}</div>
          <div><strong>Y:</strong> {selectedBlock.y}</div>
        </>
      ) : (
        <div>Haz clic en un bloque</div>
      )}
    </div>

    </>
  );
};

export default UIOverlay;


