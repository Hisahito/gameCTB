import React, { useEffect, useState } from 'react';
import './StatusPanel.css';

const StatusPanel: React.FC = () => {
  const [characterCount, setCharacterCount] = useState<number>(0);

  // Escucha el evento de respuesta de Phaser
  useEffect(() => {
    const handleResponse = (e: CustomEvent<{ count: number }>) => {
      setCharacterCount(e.detail.count);
    };

    window.addEventListener('responseCharacterCount', handleResponse as EventListener);
    return () => {
      window.removeEventListener('responseCharacterCount', handleResponse as EventListener);
    };
  }, []);

  // Al hacer clic, se dispara un evento para solicitar la cantidad
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('getCharacterCount'));
  };

  return (
    <div className="status-panel" onClick={handleClick}>
      <img src="/assets/icon.png" alt="Icono" className="status-image" />
      <span className="status-text">{characterCount} Personajes</span>
    </div>
  );
};

export default StatusPanel;
