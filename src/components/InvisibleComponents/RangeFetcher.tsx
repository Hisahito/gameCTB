// src/components/RangeFetcher.tsx
import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import characterAbi from '../../abi/Characters.json';
import { triggerCharacterStatsFetched } from '../../utils/rangeEvents';

export const RangeFetcher = () => {
  const [tokenId, setTokenId] = useState<string | null>(null);

  const { data: stats } = useReadContract({
    address: '0x75F550d3C06961411aDAAAbd4a352218B9f4eeD9',
    abi: characterAbi,
    functionName: 'getStats',
    args: tokenId ? [BigInt(tokenId)] : undefined,
  });

  useEffect(() => {
    const handler = (e: CustomEvent<{ tokenId: string }>) => {
      setTokenId(e.detail.tokenId);
    };
    window.addEventListener('fetchCharacterStats', handler as EventListener);
    return () => window.removeEventListener('fetchCharacterStats', handler as EventListener);
  }, []);

  useEffect(() => {
    if (tokenId && Array.isArray(stats)) {
      triggerCharacterStatsFetched(tokenId, stats.map(Number));
    }
  }, [stats]);

  return null;
};