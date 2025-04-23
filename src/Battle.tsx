// src/Battle.tsx
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AnimatedImage from './UI/motionIntro';
import UIOverlay from './UI/UIOverlay';
import WorldBattle from './components/WorldBattle';
import { GameSelectionProvider } from './context/GameSelectionContext';
import SendCharacterForm from './components/UIcomponents/SendCharacterForm';
import { GlobalPositionsProvider } from './context/GlobalPositionsContext';
import SendHabilityForm from './components/UIcomponents/SendHabilityForm';
import { RangeFetcher } from './components/InvisibleComponents/RangeFetcher';
import { CharacterStatsFetcher } from './components/InvisibleComponents/CharacterStatsFetcher';
import AbilityRangeFetcher from './components/InvisibleComponents/abilityRangeFetcher';

const Battle: React.FC = () => {
  return (
    <GlobalPositionsProvider>
    <GameSelectionProvider>
    <div className="relative w-full h-screen">
      <header 
        className="App-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',    // Importante para alinear arriba en vez de center
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Contenedor de la izquierda (columna) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1>Conquest The Block</h1>
          <p>Juego web desarrollado con React/TypeScript/Phaser</p>
          {/* Ahora el ConnectButton se muestra debajo del <p> */}
          <ConnectButton />
        </div>

        {/* Contenedor de la derecha (scroll horizontal para eventos) */}
        <div style={{ 
          overflowX: 'auto', 
          whiteSpace: 'nowrap', 
          maxWidth: '50%' 
        }}>
          
        </div>
      </header>
      
     

      {/* Resto de componentes debajo del header */}

      
      
      <div className="absolute inset-0 z-0" style={{ position: "relative", width: "100%", height: "100vh",display: 'flex', alignItems: "center",
    justifyContent: "center",margin: "0" , padding: "0", overflow: "hidden"}}>
          <WorldBattle/>
          <AnimatedImage
            src='src/assets/navgame/introwood.png'
            text1='Bosque Encantado'
            text2='Piso 1'
          />
          
          
          
      </div>

      {/* Formularios u overlays sobre el canvas */}
  <div className="ui-blocker">
    <div className="absolute bottom-4 right-4 pointer-events-auto">
      <SendCharacterForm />
    </div>

    <div className=" absolute bottom-4 left-4 pointer-events-auto">
      <SendHabilityForm />
    </div>
  </div>
      
    </div>

    <AbilityRangeFetcher/>

<CharacterStatsFetcher/>
    </GameSelectionProvider>
    </GlobalPositionsProvider>
    
    
  );
};

export default Battle;