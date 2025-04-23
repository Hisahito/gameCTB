// src/context/NftContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import WebSocketService from '../services/WebSocketService';

interface NftItem {
  contract: string;
  tokenId: string;
}

interface NftContextType {
  nfts: NftItem[];
  isLoading: boolean;
}

const NftContext = createContext<NftContextType>({ nfts: [], isLoading: true });

export const NftProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    setIsLoading(true);
    fetch(`http://localhost:3000/wallet/${address.toLowerCase()}/nfts`)
      .then((res) => res.json())
      .then((data) => {
        setNfts(data.nfts || []);
      })
      .catch((err) => console.error('❌ Error cargando NFTs:', err))
      .finally(() => setIsLoading(false));
  }, [address]);

  useEffect(() => {
    if (!isConnected) return;

    const socket = new WebSocketService('http://localhost:3000');

    socket.sendMessage('subscribe', { type: 'nfts', address });

    socket.socket.on('nftTransfer', (transfer: NftItem & { from: string; to: string }) => {
      setNfts((prev) => {
        const withoutOld = prev.filter(
          (nft) => !(nft.contract === transfer.contract && nft.tokenId === transfer.tokenId)
        );

        return transfer.to.toLowerCase() === address?.toLowerCase()
          ? [...withoutOld, { contract: transfer.contract, tokenId: transfer.tokenId }]
          : withoutOld;
      });
    });

    return () => {
      socket.socket.disconnect();
    };
  }, [address, isConnected]);

  return (
    <NftContext.Provider value={{ nfts, isLoading }}>
      {children}
    </NftContext.Provider>
  );
};

export const useNftContext = () => useContext(NftContext);
