// src/components/Characters.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

interface CharacterCreatedEvent {
  eventName: string;
  args: {
    owner: string;
    characterId: string;
    affinity: string;
    velocity: string;
  };
  isNew?: boolean;
}

// URL del backend; se puede parametrizar mediante variables de entorno
const BACKEND_URL = 'http://localhost:3000';
const socket = io(BACKEND_URL);

const Characters = () => {
  const [characters, setCharacters] = useState<CharacterCreatedEvent[]>([]);

  useEffect(() => {
    // Obtiene el histórico de personajes vía REST desde /characters
    async function fetchCharacters() {
      try {
        const response = await fetch(`${BACKEND_URL}/characters`);
        const data = await response.json();
        // Se espera que el backend retorne { characters: [...] }
        setCharacters(data.characters);
      } catch (error) {
        console.error('Error al obtener personajes:', error);
      }
    }
    fetchCharacters();

    // Opcional: Escucha el evento 'characters' para recibir el listado completo (si se emite)
    socket.on('characters', (data: CharacterCreatedEvent[]) => {
      setCharacters(data);
    });

    // Escucha el evento 'newEvent' y filtra los de tipo "CharacterCreated"
    socket.on('newEvent', (newEvent: CharacterCreatedEvent) => {
      if (newEvent.eventName === 'CharacterCreated') {
        setCharacters((prev) => [...prev, newEvent]);
      }
    });

    return () => {
      socket.off('characters');
      socket.off('newEvent');
    };
  }, []);

  return (
    <div>
      <h2>Mis personajes</h2>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
        {characters.map((character, index) => (
          <div
            key={index}
            style={{
              border: character.isNew ? '2px solid red' : '1px solid #ccc',
              margin: '1rem 0',
              padding: '1rem',
              borderRadius: '8px',
              flex: '0 0 auto'
            }}
          >
            <p>
              <strong>Owner:</strong> {character.args.owner}
            </p>
            <p>
              <strong>ID del Personaje:</strong> {character.args.characterId}
            </p>
            <p>
              <strong>Affinity:</strong> {character.args.affinity}
            </p>
            <p>
              <strong>Velocity:</strong> {character.args.velocity}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Characters;

