// src/context/GlobalPositionsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/WebSocketService';

export interface Position {
  tokenId: string;
  cellId: string;
  x: string;
  y: string;
}

interface GlobalPositionsContextType {
  positions: Position[];
  getPositionById: (tokenId: string) => Position | undefined;
}

const GlobalPositionsContext = createContext<GlobalPositionsContextType | undefined>(undefined);

export const GlobalPositionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    // Cargar posiciones iniciales desde backend
    fetch('http://localhost:3000/positions')
      .then((res) => res.json())
      .then((data) => {
        setPositions(data.positions);
      })
      .catch(console.error);
  }, []);

  

  useEffect(() => {
    const socket = new WebSocketService('http://localhost:3000');

    socket.socket.on('characterMoved', (data: Position) => {
      setPositions((prev) => {
        const filtered = prev.filter((p) => p.tokenId !== data.tokenId);
        return [...filtered, data];
      });
    });

    socket.socket.on('characterRemoved', ({ tokenId }: { tokenId: string }) => {
      setPositions((prev) => prev.filter((p) => p.tokenId !== tokenId));
    });

    return () => {
      socket.socket.off('characterMoved');
      socket.socket.off('characterRemoved');
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('renderCharacters', { detail: { positions } }));
  }, [positions]);

  const getPositionById = (tokenId: string) => {
    return positions.find((p) => p.tokenId === tokenId);
  };

  return (
    <GlobalPositionsContext.Provider value={{ positions, getPositionById }}>
      {children}
    </GlobalPositionsContext.Provider>
  );
};

export const useGlobalPositions = (): GlobalPositionsContextType => {
  const context = useContext(GlobalPositionsContext);
  if (!context) throw new Error('useGlobalPositions must be used within GlobalPositionsProvider');
  return context;
};

