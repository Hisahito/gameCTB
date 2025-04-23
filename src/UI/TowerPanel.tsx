import React, { useEffect, useState } from 'react';
import './StatusPanel.css';

const TowerPanel: React.FC = () => {
  const [characterCount, setCharacterCount] = useState<number>(0);

  useEffect(() => {
    const handleResponse = (e: CustomEvent<{ count: number }>) => {
      setCharacterCount(e.detail.count);
    };

    window.addEventListener('responseCharacterCount', handleResponse as EventListener);

    // 🔁 Disparar evento cada 5 segundos
    const interval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('getCharacterCount'));
    }, 5000); // <- puedes ajustar el intervalo (ms)

    return () => {
      window.removeEventListener('responseCharacterCount', handleResponse as EventListener);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="">
      <img src="/assets/icon.png" alt="Icono" className="status-image" />
      <p>Bosque Encantado</p>
      <p>Piso - 1 / {characterCount} Personajes</p>
    </div>
  );
};

export default TowerPanel;

  