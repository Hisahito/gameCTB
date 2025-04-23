// src/components/NFT/NftCard.tsx
import React, { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import characterAbi from '../../abi/Characters.json';
import abilityAbi from '../../abi/AbilityNFT.json';

interface NftCardProps {
  contract: string;
  tokenId: string;
  isSelected?: boolean;
  isAbility?: boolean;
}

interface NftMetadata {
  name: string;
  image: string;
  description?: string;
  attributes?: { trait_type: string; value: string }[];
}

const NftCard: React.FC<NftCardProps> = ({ contract, tokenId, isSelected, isAbility }) => {
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);

  const { data } = useReadContract({
    address: contract as `0x${string}`,
    abi: isAbility ? abilityAbi : characterAbi,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });

  useEffect(() => {
    if (typeof data === 'string') {
      try {
        const base64 = data.split(',')[1];
        const json = atob(base64);
        const meta = JSON.parse(json);
        setMetadata(meta);
      } catch {
        setMetadata(null);
      }
    }
  }, [data]);

  const groupedStats = metadata?.attributes;

  return (
    <div className={`rounded-xl p-4 border transition-all ${isSelected ? 'bg-red-50 border-red-500 shadow-lg' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
      {metadata?.image && (
        <img
          src={metadata.image}
          alt={metadata.name}
          className="w-full max-h-48 object-contain rounded mb-4 border"
        />
      )}
      <h2 className={`text-xl font-bold mb-1 text-center ${isSelected ? 'text-red-600' : 'text-blue-700'}`}>
        {metadata?.name || `NFT #${tokenId}`}
      </h2>
      <p className="text-sm text-gray-500 text-center mb-3">{metadata?.description}</p>

      {groupedStats && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-gray-700">
          {groupedStats.map((attr, i) => (
            <div key={i} className="flex justify-between border-b border-dashed pb-1">
              <span className="font-medium text-gray-600">{attr.trait_type}</span>
              <span className="text-right font-mono">{attr.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NftCard;



