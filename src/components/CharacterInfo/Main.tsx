// src/components/Main.tsx
import React, { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import characterAbi from '../../abi/Characters.json';
import MainPanel from './MainPanel';
import StatsPanel from './StatsPanel';
import PotentialPanel from './PotentialPanel';
import BirthDice from './BirthDice';
import TalentLegend from './TalentLegend';

export interface Attribute {
  trait_type: string;
  value: string;
}
export interface CharacterMeta {
  name: string;
  image: string;
  attributes: Attribute[];
}

interface MainProps {
  contract: `0x${string}`;
  tokenId: string;
}

const Main: React.FC<MainProps> = ({ contract, tokenId }) => {
  const [meta, setMeta] = useState<CharacterMeta | null>(null);
  const { data: uriData, isLoading, isError } = useReadContract({
    address: contract,
    abi: characterAbi,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });

  useEffect(() => {
    if (isError) return;
    if (typeof uriData === 'string') {
      try {
        const base64 = uriData.split(',')[1];
        const json = atob(base64);
        const parsed = JSON.parse(json);
        setMeta({
          name: parsed.name,
          image: parsed.image,
          attributes: parsed.attributes || [],
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [uriData, isError]);

  if (isLoading || !meta) {
    return <div className="p-4 text-center">Loading character...</div>;
  }

  return (
    <div className="flex h-full space-x-4 p-4">
      <div className="flex-1">
        <MainPanel
          name={meta.name}
          imageUrl={meta.image}
          attributes={meta.attributes}
        />
        <BirthDice contract='0x4fE8dd2166701D7fcD23fb277696EdC58250aB4b' tokenId='0'/>
        <TalentLegend/>
        
      </div>
      <div className="w-1/3">
        <StatsPanel attributes={meta.attributes} />
        <PotentialPanel attributes={meta.attributes} />
      </div>
      

    </div>
    
  );
};

export default Main;


