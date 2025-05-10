// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { v4 as uuidv4 } from 'uuid';
import { Weapons, Elements } from '../constants/options';

type FormType = {
  name: string;
  hp: number;
  attack: number;
  specialAttack: number;
  defense: number;
  specialDefense: number;
  speed: number;
  weaponId: number;
  elementId: number;
};

type Props = { player: 1 | 2 };
export const Sidebar: React.FC<Props> = ({ player }) => {
  const chars = useBattleStore((s) => (player === 1 ? s.player1 : s.player2));
  const addCharacter = useBattleStore((s) => s.addCharacter);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormType>({
    name: '', hp: 0, attack: 0, specialAttack: 0,
    defense: 0, specialDefense: 0, speed: 0,
    weaponId: Weapons[0].id, elementId: Elements[0].id
  });
  const [bulkText, setBulkText] = useState('');

  const resetForm = () => {
    setForm({
      name: '', hp: 0, attack: 0, specialAttack: 0,
      defense: 0, specialDefense: 0, speed: 0,
      weaponId: Weapons[0].id, elementId: Elements[0].id
    });
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCharacter(player, { id: uuidv4(), ...form });
    resetForm();
  };

  const importBulk = () => {
    try {
      const arr = JSON.parse(bulkText) as Partial<FormType>[];
      arr.forEach(item => {
        addCharacter(player, {
          id: uuidv4(),
          name: item.name || '',
          hp: item.hp ?? 0,
          attack: item.attack ?? 0,
          specialAttack: item.specialAttack ?? 0,
          defense: item.defense ?? 0,
          specialDefense: item.specialDefense ?? 0,
          speed: item.speed ?? 0,
          weaponId: item.weaponId ?? Weapons[0].id,
          elementId: item.elementId ?? Elements[0].id,
        });
      });
      setBulkText('');
    } catch {
      alert('JSON inválido');
    }
  };

  return (
    <div className="w-1/6 p-2 bg-gray-100 flex flex-col items-center">
      <h2 className="mb-2">Player {player}</h2>
      <textarea
        placeholder='[{"name":"Bob","hp":100,...}]'
        className="w-full h-24 p-1 border mb-2 resize-none"
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
      />
      <button onClick={importBulk} className="w-full mb-4 bg-yellow-300 rounded p-1">Importar Array</button>
      <div className="flex-1 w-full space-y-2 overflow-auto">
        {chars.map(c => (
          <div key={c.id} className="h-12 bg-white border rounded flex items-center justify-center">{c.name}</div>
        ))}
        <button onClick={() => setOpen(true)} className="h-12 w-full bg-green-200 rounded">+</button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-80 space-y-2">
            <label className="block">Nombre
              <input
                className="border p-1 w-full"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            {(['hp','attack','specialAttack','defense','specialDefense','speed'] as const).map(f => (
              <label key={f} className="block capitalize">
                {f}
                <input
                  type="number"
                  className="border p-1 w-full"
                  required
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: Number(e.target.value) })}
                />
              </label>
            ))}
            <label className="block">Arma
              <select
                className="border p-1 w-full"
                value={form.weaponId}
                onChange={(e) => setForm({ ...form, weaponId: Number(e.target.value) })}
              >
                {Weapons.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </label>
            <label className="block">Elemento
              <select
                className="border p-1 w-full"
                value={form.elementId}
                onChange={(e) => setForm({ ...form, elementId: Number(e.target.value) })}
              >
                {Elements.map(el => <option key={el.id} value={el.id}>{el.label}</option>)}
              </select>
            </label>
            <div className="flex justify-end space-x-2 mt-2">
              <button type="button" onClick={resetForm} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">Add</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}