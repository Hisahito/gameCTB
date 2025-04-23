// src/components/NFT/MyNftCards.tsx
import React, { useState, useEffect } from 'react';
import { useNftContext } from '../../context/NftContext';
import NftCard from './NftCard';
import { useGameSelection } from '../../context/GameSelectionContext';

interface MyNftCardsProps {
  filterContract?: string;
  showOnlyAbilities?: boolean;
  showOnlyCharacters?: boolean;
  compactView?: boolean;
}

const abilityContract = '0x8ba348b66db64a58c8809ec613fa9961e67f66d5';

const MyNftCards: React.FC<MyNftCardsProps> = ({ filterContract, showOnlyAbilities, showOnlyCharacters, compactView }) => {
  const { nfts, isLoading } = useNftContext();
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const { setCharacterId, setSelectedAbilityId } = useGameSelection();

  const filteredNfts = nfts.filter((nft) => {
    const matchContract = filterContract ? nft.contract.toLowerCase() === filterContract.toLowerCase() : true;
    const isAbility = nft.contract.toLowerCase() === abilityContract;
    if (showOnlyAbilities) return matchContract && isAbility;
    if (showOnlyCharacters) return matchContract && !isAbility;
    return matchContract;
  });

  useEffect(() => {
    if (!selectedTokenId) return;
    const matchedNft = filteredNfts.find(nft => nft.tokenId === selectedTokenId);
    if (!matchedNft) return;

    const isAbility = matchedNft.contract.toLowerCase() === abilityContract;
    if (isAbility) {
      setSelectedAbilityId(selectedTokenId);
    } else {
      setCharacterId(selectedTokenId);
    }
  }, [selectedTokenId, filteredNfts, setCharacterId, setSelectedAbilityId]);

  if (isLoading) {
    return <div className="text-center mt-10 text-blue-500 animate-pulse">Cargando tus NFTs...</div>;
  }

  if (filteredNfts.length === 0) {
    return <div className="text-center mt-10 text-gray-400">No tienes NFTs disponibles para mostrar.</div>;
  }

  return (
    <div className={`p-4 ${compactView ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
      {filteredNfts.map((nft, idx) => {
        const isAbility = nft.contract.toLowerCase() === abilityContract;
        return (
          <div key={`${nft.contract}-${nft.tokenId}-${idx}`} onClick={() => setSelectedTokenId(nft.tokenId)}>
            <NftCard
              contract={nft.contract}
              tokenId={nft.tokenId}
              isSelected={selectedTokenId === nft.tokenId}
              isAbility={isAbility}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MyNftCards;










