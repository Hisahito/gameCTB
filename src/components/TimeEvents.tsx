import { useEffect, useState } from 'react'
import { publicClient } from '../config/client'
import { parseAbi, parseEventLogs } from 'viem'

// Definimos el ABI para ambos eventos
const eventAbis = parseAbi([
  'event BlockConquestStarted(uint256 indexed blockId, uint256 indexed characterId, uint256 conquestEndBlock, uint256 blocksRemaining)',
  'event CharacterCreated(uint256 characterId, uint256 affinity, uint256 velocity)',
  'event BlockChallenged(uint256 indexed blockId,uint256 indexed attackerId,uint256 previousOwner,uint256 conquestEndBlock,uint256 blocksRemaining)',
  'event BlockDefended(uint256 indexed blockId,uint256 indexed characterId)',
  'event BlockVasallo(uint256 indexed blockId,uint256 indexed vasalId,uint256 originalOwner)'
])

const TimeEvents = () => {
  const [decodedLogs, setDecodedLogs] = useState<any[]>([])

  // Función que decodifica un log y lo agrega al estado
  const handleLog = (log: any) => {
    try {
      const decodedArray = parseEventLogs({
        abi: eventAbis,
        logs: [log],
      })
      if (decodedArray.length > 0) {
        console.log('Decoded log:', decodedArray[0])
        setDecodedLogs(prev => [...prev, decodedArray[0]])
      } else {
        console.warn('Log no coincide con ningún evento:', log)
      }
    } catch (error) {
      console.error('Error decoding log:', error)
    }
  }

  // Carga histórica de eventos
  useEffect(() => {
    async function fetchEvents() {
      try {
        const logs = await publicClient.getLogs({
          address: '0x6A04F6C5dbd2eb417aEF84982a76509BEB5ec85d',
          events: eventAbis,
          fromBlock: 48628746n,
          toBlock: 'latest',
        })
        console.log('Historical logs:', logs)
        logs.forEach((log) => {
          handleLog(log)
        })
      } catch (error) {
        console.error('Error al obtener los eventos históricos:', error)
      }
    }
    fetchEvents()
  }, [])

  // Suscripción a nuevos eventos (watchEvent)
  useEffect(() => {
    const unwatch = publicClient.watchEvent({
      address: '0x6A04F6C5dbd2eb417aEF84982a76509BEB5ec85d',
      events: eventAbis,
      onLogs: (logs) => {
        console.log('New logs:', logs)
        logs.forEach((log) => {
          handleLog(log)
        })
      },
    })
    return () => {
      unwatch()
    }
  }, [])

  return (
    <div>
      <h2>Eventos Decodificados</h2>
      {decodedLogs.length === 0 ? (
        <p>No hay eventos decodificados aún.</p>
      ) : (
        // Se utiliza un replacer en JSON.stringify para convertir BigInt a string.
        <pre>
          {JSON.stringify(decodedLogs, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2)}
        </pre>
      )}
    </div>
  )
}

export default TimeEvents


