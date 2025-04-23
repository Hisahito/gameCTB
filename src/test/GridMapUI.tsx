import React, { useEffect, useState } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import abi from '../abi/GridMap.json';
import MyNftCards from '../components/NFT/MyNftCards';

export default function GridMapBase() {
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(110);

  /** ---------------------------  NUEVOS ESTADOS  --------------------------- */
  // Para mover un personaje (ya existía)
  const [selected, setSelected] = useState<{
    blockId: number;
    x: number;
    y: number;
  } | null>(null);
  const [characterId, setCharacterId] = useState<string>('');

  // Para CARGAR personajes desde la cadena
  const [loadInputId, setLoadInputId] = useState<string>('');         // valor del input
  const [triggerLoadId, setTriggerLoadId] = useState<bigint | null>(  // id que dispara la lectura
    null
  );
  const [charactersOnMap, setCharactersOnMap] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  /** ---------------------------  HOOKS WAGMI  --------------------------- */
  // write: mover personaje
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  // read: obtener posición (se dispara cada vez que triggerLoadId cambia)
  const {
    data: loadedPosition,
    isSuccess: loadSuccess,
    isFetching: loadPending,
    error: loadError,
  } = useReadContract({
    address: '0xd38092C42F7BeEE20c6E7ccA25c058119e49B245',
    abi,
    functionName: 'getPosition',
    args: [triggerLoadId ?? BigInt(1)],
  });

  /** ---------------------------  EFECTOS  --------------------------- */
  // Cuando llega la posición, la añadimos/actualizamos en el estado charactersOnMap
  useEffect(() => {
    if (loadSuccess && loadedPosition && triggerLoadId !== null) {
      const [x, y] = loadedPosition as [bigint, bigint];

      setCharactersOnMap(prev => {
        const newChar = {
          id: triggerLoadId.toString(),
          x: Number(x),
          y: Number(y),
        };

        // Si ya está en el arreglo, actualiza su posición; si no, lo añade
        const index = prev.findIndex(c => c.id === newChar.id);
        if (index > -1) {
          const copy = [...prev];
          copy[index] = newChar;
          return copy;
        }
        return [...prev, newChar];
      });

      // limpia gatillo e input
      setTriggerLoadId(null);
      setLoadInputId('');
    }
  }, [loadSuccess, loadedPosition, triggerLoadId]);

  // Cuando el movimiento on‑chain (write) se confirma, refrescamos la posición del personaje movido
  useEffect(() => {
    if (isSuccess && characterId) {
      setTriggerLoadId(BigInt(characterId));
    }
  }, [isSuccess, characterId]);

  /** ---------------------------  CELDAS DEL GRID  --------------------------- */
  const cells: { x: number; y: number; blockId: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push({ x, y, blockId: y * width + x });
    }
  }

  /** ---------------------------  HANDLERS  --------------------------- */
  const handleSend = () => {
    if (!selected || !characterId) return;
    writeContract({
      address: '0xd38092C42F7BeEE20c6E7ccA25c058119e49B245',
      abi,
      functionName: 'moveCharacter',
      args: [BigInt(characterId), BigInt(selected.blockId)],
    });
  };

  const handleLoadCharacter = () => {
    if (loadInputId) {
      setTriggerLoadId(BigInt(loadInputId));
    }
  };

  /** ---------------------------  RENDER  --------------------------- */
  return (
    <div className="p-4">
      {/* ---------- Controles de tamaño ---------- */}
      <div className="flex space-x-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Width</label>
          <input
            type="number"
            min={1}
            value={width}
            onChange={e => setWidth(Number(e.target.value) || 1)}
            className="mt-1 block w-24 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Height</label>
          <input
            type="number"
            min={1}
            value={height}
            onChange={e => setHeight(Number(e.target.value) || 1)}
            className="mt-1 block w-24 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ---------- NUEVO FORMULARIO: cargar personajes en el mapa ---------- */}
      <div className="mb-4 p-4 border border-green-300 rounded bg-green-50">
        <h3 className="text-sm font-semibold text-green-800 mb-2">
          Cargar personajes en el mapa
        </h3>
        <div className="flex space-x-2 items-center">
          <input
            type="number"
            placeholder="Character ID"
            value={loadInputId}
            onChange={e => setLoadInputId(e.target.value)}
            className="w-32 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleLoadCharacter}
            disabled={!loadInputId || loadPending}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loadPending ? 'Cargando...' : 'Cargar'}
          </button>
        </div>
        {loadError && (
          <p className="mt-2 text-red-700">Error: {loadError.message}</p>
        )}
      </div>

      {/* ---------- Grid dinámico con scroll ---------- */}
      <div
        className="overflow-auto border border-gray-300"
        style={{ height: '600px', width: '100%' }}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${width}, 60px)`, gridAutoRows: '60px' }}
        >
          {cells.map(cell => {
            const isSelected = selected?.blockId === cell.blockId;
            const charInCell = charactersOnMap.find(
              c => c.x === cell.x && c.y === cell.y
            );

            return (
              <div
                key={cell.blockId}
                onClick={() => setSelected(cell)}
                className={`border border-gray-200 flex items-center justify-center cursor-pointer ${
                  isSelected ? 'bg-blue-100' : 'bg-white'
                }`}
              >
                {charInCell ? (
                  <span className="text-xl select-none">♟️</span> // pieza de ajedrez
                ) : (
                  <span className="text-xs font-semibold">#{cell.blockId}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Detalle seleccionado y acción ---------- */}
      {selected && (
        <div className="mt-4 p-4 border border-blue-300 rounded bg-blue-50">
          <p className="text-sm text-blue-800 mb-2">
            Seleccionado: <span className="font-medium">#{selected.blockId}</span> &nbsp;
            Coordenadas:{' '}
            <span className="font-medium">
              ({selected.x}, {selected.y})
            </span>
          </p>
          <div className="flex space-x-2 items-center">
            <input
              type="number"
              placeholder="Character ID"
              value={characterId}
              onChange={e => setCharacterId(e.target.value)}
              className="w-32 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Enviando...' : 'Mover Personaje'}
            </button>
          </div>
          {isSuccess && <p className="mt-2 text-green-700">Transacción enviada</p>}
          {error && <p className="mt-2 text-red-700">Error: {error.message}</p>}
        </div>
      )}

<MyNftCards filterContract="0x75F550d3C06961411aDAAAbd4a352218B9f4eeD9" />
<MyNftCards filterContract="0x8BA348B66Db64A58C8809eC613Fa9961e67f66d5" />
    </div>
  );
}






