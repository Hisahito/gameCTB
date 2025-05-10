// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { NftProvider } from './context/NftContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider,http } from 'wagmi';
import { mainnet , arbitrumNova,bscTestnet} from 'wagmi/chains'
  import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
  import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css';
import { BrowserRouter, Routes, Route} from "react-router";
import MapCanvas2 from './components/World2';
import CharacterAbilityCalculator from './test/CalculatorUI';
import GridMapBase from './test/GridMapUI';
import WorldBattle from './components/WorldBattle';
import Battle from './Battle';
import { AutoBattle } from './AutoBattle';
import StatsPanel from './components/CharacterInfo/StatsPanel';
import MainPanel from './components/CharacterInfo/MainPanel';
import Main from './components/CharacterInfo/Main';


// import './styles/index.css'; // Importa los estilos globales

// Se obtiene el elemento root desde el archivo index.html
const rootElement = document.getElementById('root');

const queryClient = new QueryClient()

const config = getDefaultConfig({

  appName: 'RainbowKit demo',

  projectId: 'Conquest',

  chains: [mainnet,arbitrumNova,bscTestnet],

  transports: {

    [mainnet.id]: http(),
    [arbitrumNova.id]: http(),
    [bscTestnet.id]: http(),

  },

})



if (rootElement) {
  // Se crea el root de React y se renderiza el componente principal <App />
  ReactDOM.createRoot(rootElement).render(
    <BrowserRouter>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <NftProvider>
    <React.StrictMode>
      <Routes>
      <Route path="/" element={<App />} />
      <Route path="/map" element={<GridMapBase />} />
      <Route path="game" element={<CharacterAbilityCalculator/>} />
      <Route path="/battle" element={<Battle/>} />
      <Route path="/auto" element={<AutoBattle/>} />
      <Route path="/test" element={<Main contract='0x4fE8dd2166701D7fcD23fb277696EdC58250aB4b' tokenId='0'/>} />
      </Routes>
    </React.StrictMode>
    </NftProvider>
    </RainbowKitProvider>
    </QueryClientProvider>
    </WagmiProvider>
    </BrowserRouter>
  );
}

