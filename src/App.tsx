// src/App.tsx
import React from 'react';
import MapCanvasIsometric from './components/PhaserCanvas';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CreateCharacter } from './components/CreateCharacter';
import HistoricalCharacterEvents from './components/Characters';
import CharacterEventListener from './components/WebsocketCharacter';
import CharacterAlchemyEventListener from './components/AlchemySocket';
import TransferEventsListener from './components/AlchemySocket';
import MapCanvas2 from './components/World2';
import TimeEvents from './components/TimeEvents';
import Positions from './components/positions';
import BlocksList from './components/BlockList';
import BlockCounter from './components/BlockCounter';
import StatusPanel from './UI/test';
import AnimatedImage from './UI/motionIntro';
import UIOverlay from './UI/UIOverlay';

const App: React.FC = () => {
  return (
    <div className="App">
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
          <HistoricalCharacterEvents />
          
        </div>
      </header>
      <CreateCharacter/>
      <Positions/>
      <BlocksList/>
      
     

      {/* Resto de componentes debajo del header */}

      
      
      <div style={{ position: "relative", width: "100%", height: "100vh",display: 'flex', alignItems: "center",
    justifyContent: "center",margin: "0" , padding: "0", overflow: "hidden"}}>
          <MapCanvas2 />
          <AnimatedImage
            src='src/assets/navgame/introwood.png'
            text1='Bosque Encantado'
            text2='Piso 1'
          />
          <UIOverlay/>
      </div>
      
      
    </div>
    
  );
};

export default App;
