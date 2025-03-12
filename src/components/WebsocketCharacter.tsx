// CharacterEventListener.tsx
import React, { useEffect, useState } from 'react'
import { parseAbiItem } from 'viem'
import { publicClient } from '../config/client'
import abi from '../abi/TimeMachine.json'

interface CharacterCreatedEvent {
  characterId: string
  affinity: string
  velocity: string
  transactionHash?: string
  blockNumber?: number
}

const CharacterEventListener: React.FC = () => {
  const [events, setEvents] = useState<CharacterCreatedEvent[]>([])

  useEffect(() => {
    // Define el evento usando parseAbiItem.
    // Asegúrate de que la firma del evento coincida con la definida en tu ABI.
    const characterEvent = parseAbiItem(
      'event CharacterCreated(uint256 characterId, uint256 affinity, uint256 velocity)'
    )

    // Inicia la suscripción al evento usando watchEvent.
    const unwatch = publicClient.watchEvent({
      address: '0x6A04F6C5dbd2eb417aEF84982a76509BEB5ec85d', // Dirección de tu smart contract
      event: characterEvent,
      poll: false, // Usamos WebSocket si está disponible
      onLogs(newLogs) {
        // newLogs es un array de logs decodificados
        const parsedEvents = newLogs.map((log: any) => ({
          characterId: log.args?.characterId.toString(),
          affinity: log.args?.affinity.toString(),
          velocity: log.args?.velocity.toString(),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        }))
        setEvents((prev) => [...prev, ...parsedEvents])
      },
      onError(error) {
        console.error('Error al escuchar el evento:', error)
      },
    })

    // Limpieza: detiene la suscripción al desmontar el componente
    return () => {
      unwatch()
    }
  }, [])

  return (
    <div>
      <h1>Eventos CharacterCreated</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {events.map((event, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              width: '250px',
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
            {event.transactionHash && (
              <p>
                <strong>Tx:</strong> {event.transactionHash}
              </p>
            )}
            {event.blockNumber && (
              <p>
                <strong>Bloque:</strong> {event.blockNumber}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CharacterEventListener


