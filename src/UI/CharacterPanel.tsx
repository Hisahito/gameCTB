import React from 'react';

export interface CharacterPanelProps {
  onClose: () => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '60%',
        height: '60%',
        backgroundColor: 'brown', // Fondo café
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: '1rem',
      }}
    >
      {/* Botón para cerrar */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        ×
      </button>
      <h2>Panel de Personajes</h2>
      {/* Aquí podrás agregar más contenido futuro */}
    </div>
  );
};

export default CharacterPanel;
