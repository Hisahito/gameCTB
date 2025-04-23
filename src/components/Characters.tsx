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

interface CharactersProps {
  selectedCharacters?: string[]; // Se vuelve opcional para manejar el caso undefined
  onToggleCharacter: (characterId: string) => void;
}

const BACKEND_URL = 'http://localhost:3000';
const socket = io(BACKEND_URL);

const Characters: React.FC<CharactersProps> = ({
  selectedCharacters = [], // Valor por defecto en caso de que no se pase la prop
  onToggleCharacter,
}) => {
  console.log('Selected Characters:', selectedCharacters);

  const [characters, setCharacters] = useState<CharacterCreatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    async function fetchCharacters() {
      try {
        setIsLoading(true);
        const response = await fetch(`${BACKEND_URL}/characters`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // Usa data.characters si existe, de lo contrario usa data directamente
        const retrievedCharacters = data.characters || data;
        if (!Array.isArray(retrievedCharacters)) {
          console.error('El formato recibido no es un array, se usará un array vacío.');
          setCharacters([]);
        } else if (retrievedCharacters.length === 0) {
          console.warn('Array vacío recibido, se reintentará en 3 segundos...');
          retryTimeout = setTimeout(fetchCharacters, 3000);
        } else {
          setCharacters(retrievedCharacters);
        }
      } catch (error) {
        console.error('Error al obtener personajes:', error);
        // En caso de error, reintenta la petición luego de 3 segundos
        retryTimeout = setTimeout(fetchCharacters, 3000);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCharacters();

    // Configuración de socket para recibir personajes en tiempo real
    socket.on('characters', (data: CharacterCreatedEvent[]) => {
      if (Array.isArray(data)) {
        setCharacters(data);
      } else {
        console.error('Datos recibidos por socket no son un array:', data);
      }
    });

    // Si requieres manejar nuevos eventos, descomenta y ajusta según necesites.
     socket.on('newEvent', (newEvent: CharacterCreatedEvent) => {
       if (newEvent.eventName === 'CharacterCreated' && newEvent.args) {
       setCharacters((prev) => [...prev, newEvent]);
       }
     });

    return () => {
      socket.off('characters');
      // socket.off('newEvent');
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <div>
      <h2>Mis personajes</h2>
      {isLoading && <p>Cargando personajes...</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {characters.map((character, index) => {
          // Verificar que character.args exista antes de acceder a sus propiedades
          if (!character.args) return null;
          const { owner, characterId, affinity, velocity } = character.args;
          const isSelected = selectedCharacters.includes(characterId);
          const order = selectedCharacters.indexOf(characterId) + 1;

          return (
            <div
              key={index}
              onClick={() => onToggleCharacter(characterId)}
              style={{
                border: isSelected ? '2px solid lime' : '1px solid #ccc',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: isSelected ? '#112' : '#222',
              }}
            >
              <p>
                <strong>Owner:</strong> {owner}
              </p>
              <p>
                <strong>ID del Personaje:</strong> {characterId}
              </p>
              <p>
                <strong>Affinity:</strong> {affinity}
              </p>
              <p>
                <strong>Velocity:</strong> {velocity}
              </p>
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    color: 'lime',
                    fontWeight: 'bold',
                    fontSize: '20px',
                  }}
                >
                  {order}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Characters;





