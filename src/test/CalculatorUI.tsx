import React, { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import characterAbi from '../abi/Characters.json';
import abilityAbi   from '../abi/AbilityNFT.json';
import damageAbi    from '../abi/DamageCalculator.json';
import './CalculatorUI.css';

const CHARACTER_CONTRACT_ADDRESS = '0x75F550d3C06961411aDAAAbd4a352218B9f4eeD9';
const ABILITY_CONTRACT_ADDRESS   = '0x8BA348B66Db64A58C8809eC613Fa9961e67f66d5';
const DAMAGE_CALC_CONTRACT_ADDRESS = '0x21b691AfAC803f4C98Ac6Bb7B4bB3B558AD4f299';

export default function CharacterAbilityCalculator() {
  const [charId, setCharId] = useState<string>('');
  const [abilityId, setAbilityId] = useState<string>('');
  const [charMeta, setCharMeta] = useState<any>(null);
  const [abilityMeta, setAbilityMeta] = useState<any>(null);
  const [damage, setDamage] = useState<string | null>(null);

  // Hook para leer tokenURI del personaje
  const { data: charUriRaw } = useReadContract({
    address: CHARACTER_CONTRACT_ADDRESS,
    abi: characterAbi,
    functionName: 'tokenURI',
    args: [charId ? BigInt(charId) : BigInt(0)],
  });

  // Hook para leer tokenURI de la habilidad
  const { data: abilityUriRaw } = useReadContract({
    address: ABILITY_CONTRACT_ADDRESS,
    abi: abilityAbi,
    functionName: 'tokenURI',
    args: [abilityId ? BigInt(abilityId) : BigInt(0)],
  });

  // Hook para calcular daño (computeDamage)
  const { data: damageRaw, error: damageError, isError: isDamageError, isLoading: isDamageLoading, refetch } = useReadContract({
    address: DAMAGE_CALC_CONTRACT_ADDRESS,
    abi: damageAbi,
    functionName: 'computeDamage',
    args: [abilityId ? BigInt(abilityId) : BigInt(0), charId ? BigInt(charId) : BigInt(0)],
  });

  // Parsear Base64 JSON a objeto para personaje
  useEffect(() => {
    if (typeof charUriRaw === 'string') {
      try {
        const b64 = charUriRaw.split(',')[1];
        const json = atob(b64);
        setCharMeta(JSON.parse(json));
      } catch {
        setCharMeta(null);
      }
    }
  }, [charUriRaw]);

  // Parsear Base64 JSON a objeto para habilidad
  useEffect(() => {
    if (typeof abilityUriRaw === 'string') {
      try {
        const b64 = abilityUriRaw.split(',')[1];
        const json = atob(b64);
        setAbilityMeta(JSON.parse(json));
      } catch {
        setAbilityMeta(null);
      }
    }
  }, [abilityUriRaw]);

  // Actualizar daño cuando damageRaw cambie
  useEffect(() => {
    console.log('damageRaw changed:', damageRaw, 'error:', damageError);
    if (damageError) {
      console.error('Error fetching damage:', damageError);
    }
    if (damageRaw != null) {
      const val = (damageRaw as bigint).toString();
      console.log('damage computed:', val);
      setDamage(val);
    }
  }, [damageRaw, damageError]);

  const handleCalculate = async () => {
    console.log('Calculating damage with charId=', charId, 'abilityId=', abilityId);
    try {
      const result = await refetch();
      console.log('refetch result:', result);
    } catch (e) {
      console.error('Error calling computeDamage:', e);
    }
    // Dispara recálculo de computeDamage
    await refetch();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
        <ConnectButton/>
      <div className="grid grid-cols-2 gap-6">
        {/* Personaje */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="font-bold mb-2">Personaje #{charId}</h2>
          <input
            type="text"
            placeholder="Character ID"
            value={charId}
            onChange={e => { setCharId(e.target.value); setDamage(null); }}
            className="border mb-4 p-2 w-full"
          />
          {charMeta ? (
            <>
              <img src={charMeta.image} alt={charMeta.name} className="w-full object-cover rounded mb-2" />
              <h3 className="mt-2 text-xl">{charMeta.name}</h3>
              <ul className="mt-2 space-y-1">
                {charMeta.attributes.map((attr: any) => (
                  <li key={attr.trait_type}>
                    <strong>{attr.trait_type}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-gray-500">Ingrese un ID válido</p>
          )}
        </div>

        {/* Habilidad */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="font-bold mb-2">Habilidad #{abilityId}</h2>
          <input
            type="text"
            placeholder="Ability ID"
            value={abilityId}
            onChange={e => { setAbilityId(e.target.value); setDamage(null); }}
            className="border mb-4 p-2 w-full"
          />
          {abilityMeta ? (
            <>
              <img src={abilityMeta.image} alt={abilityMeta.name} className="w-full object-cover rounded mb-2" />
              <h3 className="mt-2 text-xl">{abilityMeta.name}</h3>
              <ul className="mt-2 space-y-1">
                {abilityMeta.attributes.map((attr: any) => (
                  <li key={attr.trait_type}>
                    <strong>{attr.trait_type}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-gray-500">Ingrese un ID válido</p>
          )}
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-2xl shadow hover:bg-blue-700 transition"
      >
        Calcular Daño
      </button>

      {damage !== null && (
        <div className="mt-4 text-center text-xl">
          <strong>Daño Resultante:</strong> {damage}
        </div>
      )}
    </div>
  );
}



