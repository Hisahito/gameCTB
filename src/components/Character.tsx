// src/components/Characters.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

interface CharacterCreatedEvent {
  characterId: string;
  affinity: string;
  velocity: string;
  isNew?: boolean;
}

// Configura la URL del backend, puedes usar una variable de entorno si lo prefieres
const BACKEND_URL = 'http://localhost:3000';
const socket = io(BACKEND_URL);

const HistoricalCharacterEvents = () => {
  const [events, setEvents] = useState<CharacterCreatedEvent[]>([]);

  useEffect(() => {
    // Obtén el listado histórico de personajes vía REST del backend
    async function fetchEvents() {
      try {
        const response = await fetch(`${BACKEND_URL}/characters`);
        const data = await response.json();
        // Se espera que el backend retorne { characters: [...] }
        setEvents(data.characters);
      } catch (error) {
        console.error('Error al obtener los eventos históricos:', error);
      }
    }
    fetchEvents();

    // Escucha el evento 'characters' para recibir el listado inicial (opcional)
    socket.on('characters', (data: CharacterCreatedEvent[]) => {
      setEvents(data);
    });

    // Escucha el evento 'newCharacter' para actualizar la UI en tiempo real
    socket.on('newCharacter', (newCharacter: CharacterCreatedEvent) => {
      setEvents(prev => [...prev, newCharacter]);
    });

    return () => {
      socket.off('characters');
      socket.off('newCharacter');
    };
  }, []);

  return (
    <div>
      <h2>Histórico de CharacterCreated</h2>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
        {events.map((event, index) => (
          <div
            key={index}
            style={{
              border: event.isNew ? '2px solid red' : '1px solid #ccc',
              margin: '1rem 0',
              padding: '1rem',
              borderRadius: '8px',
              flex: '0 0 auto'
            }}
          >
            <p>
              <strong>ID del Personaje:</strong> {event.characterId}
            </p>
            <p>
              <strong>Affinity:</strong> {event.affinity}
            </p>
            <p>
              <strong>Velocity:</strong> {event.velocity}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricalCharacterEvents;
