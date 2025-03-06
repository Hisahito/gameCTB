// src/components/BlockForm.tsx
import React from 'react';

interface BlockFormProps {
  blockId: number;
  characterId: string;
  defender: boolean;
  onChangeCharacterId: (value: string) => void;
  onChangeDefender: (value: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const BlockForm: React.FC<BlockFormProps> = ({
  blockId,
  characterId,
  defender,
  onChangeCharacterId,
  onChangeDefender,
  onSubmit,
  onClose,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -20%)',
        background: '#fff',
        padding: '20px',
        border: '1px solid #000',
        borderRadius: '8px',
        zIndex: 10,
      }}
    >
      {/* Botón para cerrar el formulario */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}>
          X
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <div>
          <label>
            <strong>Block ID:</strong> {blockId}
          </label>
        </div>
        <div>
          <label>
            Character ID:
            <input
              type="number"
              name="characterId"
              value={characterId}
              onChange={(e) => onChangeCharacterId(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Defender:
            <input
              type="checkbox"
              name="defender"
              checked={defender}
              onChange={(e) => onChangeDefender(e.target.checked)}
            />
          </label>
        </div>
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default BlockForm;
