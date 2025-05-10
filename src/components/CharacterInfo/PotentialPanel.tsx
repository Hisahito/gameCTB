import React, { useState } from 'react';
import PanelContainer from './PanelContainer';
import { Attribute } from './Main';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PotentialPanelProps {
  attributes: Attribute[]; // PP attributes passed in
}

/**
 * PotentialPanel dibuja una gráfica tipo "estrella" (radar) con valores PP o Talents.
 */
const PotentialPanel: React.FC<PotentialPanelProps> = ({ attributes }) => {
  const [mode, setMode] = useState<'PP' | 'Talents'>('Talents');

  // Extraer subjects (stats)
  const subjects = attributes
    .filter(attr => attr.trait_type.endsWith('PP'))
    .map(attr => attr.trait_type.replace(' PP', ''));

  // Datos PP (0–30)
  const ppData = subjects.map(subject => {
    const attr = attributes.find(a => a.trait_type === `${subject} PP`);
    return { subject, value: attr ? Number(attr.value) : 0 };
  });

  // Datos Talents hardcodeados [0,0,2,1,2,1], ajustados +1 para evitar centro
  const talents = [0, 0, 2, 1, 2, 1];
  const talentData = subjects.map((subject, i) => ({ subject, value: talents[i] + 1 }));

  const data = mode === 'PP' ? ppData : talentData;

  // Configuración del Radio Axis
  const domain = mode === 'PP' ? [0, 30] : [1, 3];
  const ticks = mode === 'PP' ? undefined : [1, 2, 3];
  const tickFormatter = (t: number) =>
    mode === 'PP'
      ? t.toString()
      : { 1: 'Debilidad', 2: 'Normal', 3: 'Maestro' }[t as 1 | 2 | 3];

  const title = mode === 'PP' ? 'Potential Stats' : 'Talents';
  const radarColor = mode === 'PP' ? '#FFD700' : '#FF4D4F';

  return (
    <PanelContainer>
      {/* Toggle buttons */}
      <div className="flex space-x-2 mb-2">
        <button
          onClick={() => setMode('PP')}
          className={`px-3 py-1 rounded text-sm font-medium ${mode === 'PP' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-white'}`}
        >
          PP
        </button>
        <button
          onClick={() => setMode('Talents')}
          className={`px-3 py-1 rounded text-sm font-medium ${mode === 'Talents' ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'}`}
        >
          Talents
        </button>
      </div>
      {/* Chart */}
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <RadarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff' }} />
            <PolarRadiusAxis
              angle={30}
              domain={domain}
              ticks={ticks}
              tickFormatter={tickFormatter}
              tick={{ fill: '#aaa' }}
            />
            <Radar
              name={title}
              dataKey="value"
              stroke={radarColor}
              fill={radarColor}
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </PanelContainer>
  );
};

export default PotentialPanel;


