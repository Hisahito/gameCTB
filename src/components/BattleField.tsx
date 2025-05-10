// src/components/BattleField.tsx
import React, { useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { simulateBattle } from '../utils/battleAlgorithm';

export const BattleField: React.FC = ()=>{
  const p1 = useBattleStore(s=>s.player1);
  const p2 = useBattleStore(s=>s.player2);
  const [log,setLog] = useState<string[]>([]);
  const start=()=>setLog(simulateBattle(p1,p2));
  return (
    <div className="flex-1 p-4 flex flex-col items-center">
      <div className="flex space-x-8">
        <div className="space-y-4">{p1.slice(0,3).map(c=><div key={c.id}>{c.name}</div>)}</div>
        <div className="space-y-4">{p2.slice(0,3).map(c=><div key={c.id}>{c.name}</div>)}</div>
      </div>
      {p1.length>=3&&p2.length>=3&&<button onClick={start} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Iniciar Batalla</button>}
      {log.length>0&&<div className="mt-4 w-full max-w-md bg-gray-100 p-2 rounded h-40 overflow-auto">
        {log.map((e,i)=><div key={i} className="text-sm">{e}</div>)}
      </div>}
    </div>
  );
};