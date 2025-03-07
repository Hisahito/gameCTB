// src/components/Positions.tsx
import { useEffect, useState } from 'react';
import WebSocketService from '../services/WebSocketService';
import GameStateManager, { BlockConquestStartedEvent } from '../managers/GameStateManager';

interface PositionsResponse {
  positions: { [characterId: string]: BlockConquestStartedEvent };
}

const BACKEND_URL = 'http://localhost:3000';

const Positions = () => {
  const [positions, setPositions] = useState<{ [characterId: string]: BlockConquestStartedEvent }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Función para obtener el histórico de posiciones desde el endpoint /positions
    async function fetchPositions() {
      try {
        const response = await fetch(`${BACKEND_URL}/positions`);
        const data: PositionsResponse = await response.json();
        setPositions(data.positions);
      } catch (error) {
        console.error('Error al obtener posiciones:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPositions();

    // Inicializa la conexión WebSocket (se encarga de suscribirse a 'newEvent' y despachar al GameStateManager)
    const wsService = new WebSocketService(BACKEND_URL);

    // Función para actualizar la posición de un personaje al recibir un nuevo evento
    const handleBlockConquestStarted = (newEvent: BlockConquestStartedEvent) => {
      setPositions((prevPositions) => {
        const characterId = newEvent.args.characterId;
        // Actualiza solo si no hay posición previa o el nuevo blockNumber es mayor
        if (
          !prevPositions[characterId] ||
          BigInt(newEvent.blockNumber) > BigInt(prevPositions[characterId].blockNumber)
        ) {
          return { ...prevPositions, [characterId]: newEvent };
        }
        return prevPositions;
      });
    };

    // Se suscribe al evento interno
    GameStateManager.on('blockConquestStarted', handleBlockConquestStarted);

    return () => {
      GameStateManager.off('blockConquestStarted', handleBlockConquestStarted);
    };
  }, []);

  if (loading) {
    return <div>Cargando posiciones...</div>;
  }

  return (
    <div>
      <h2>Posición Actual de Personajes</h2>
      {Object.entries(positions).length === 0 ? (
        <p>No hay posiciones disponibles.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID Personaje</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Bloque Actual</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID Bloque</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Conquest End Block</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Blocks Remaining</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(positions).map(([characterId, event]) => (
              <tr key={characterId}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{characterId}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{event.blockNumber}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{event.args.blockId}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{event.args.conquestEndBlock}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{event.args.blocksRemaining}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{event.transactionHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Positions;


