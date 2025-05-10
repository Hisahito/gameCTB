// src/utils/battleAlgorithm.ts
import { Character } from '../store/useBattleStore';

// Definiciones de ventaja
const weaponBeats: Record<number, number> = { 1: 2, 2: 3, 3: 1 };
const elementBeats: Record<number, [number, number]> = {
  1: [3, 8],  // Fuego vence a Tierra, Oscuridad
  2: [1, 4],  // Agua vence a Fuego, Viento
  3: [4, 5],  // Tierra vence a Viento, Electricidad
  4: [2, 6],  // Viento vence a Agua, Hielo
  5: [4, 1],  // Electricidad vence a Viento, Fuego
  6: [5, 7],  // Hielo vence a Electricidad, Luz
  7: [5, 9],  // Luz vence a Electricidad, Físico
  8: [6, 7],  // Oscuridad vence a Hielo, Luz
  9: [2, 4],  // Físico vence a Agua, Viento
};

/**
 * Simula exactamente la lógica del contrato Solidity:
 * 1) Combina y ordena los 6 personajes por velocidad.
 * 2) Cada uno ataca en orden al primer enemigo vivo de la mitad opuesta.
 * 3) Calcula daño base y aplicadores (120/100/80), resta HP en memory.
 * @returns Array de logs paso a paso que reflejan los mismos resultados on-chain.
 */
export function simulateBattle(p1: Character[], p2: Character[]): string[] {
  // 1) Combinar y clonar
  const participants: Character[] = [
    ...p1.slice(0, 3).map(c => ({ ...c })),
    ...p2.slice(0, 3).map(c => ({ ...c })),
  ];
  // 2) Ordenar por velocidad descendente
  participants.sort((a, b) => b.speed - a.speed);

  const log: string[] = [];
  log.push('⚔️ Comienza la batalla (lógica Solidity)');

  // 3) Seis ataques secuenciales
  for (let idx = 0; idx < participants.length; idx++) {
    const attacker = participants[idx];
    // Si ya está muerto
    if (attacker.hp <= 0) {
      log.push(`💀 ${attacker.name} está muerto y no ataca.`);
      continue;
    }
    // Determinar medio (mitad ordenada): primeros 3 vs últimos 3
    const isTeam1 = idx < 3;
    // Buscar primer enemigo vivo en la otra mitad
    let targetIdx = -1;
    for (let k = 0; k < participants.length; k++) {
      if ((k < 3) === isTeam1) continue;
      if (participants[k].hp > 0) { targetIdx = k; break; }
    }
    if (targetIdx < 0) {
      log.push(`✅ ${attacker.name} no encuentra enemigos vivos.`);
      continue;
    }
    const target = participants[targetIdx];

    // Daño base
    const base = Math.max(attacker.attack - target.defense, 1);
    // Modificador de arma
    let wMod = 100;
    if (weaponBeats[attacker.weaponId] === target.weaponId) wMod = 120;
    else if (weaponBeats[target.weaponId] === attacker.weaponId) wMod = 80;
    // Modificador de elemento
    let eMod = 100;
    const wins = elementBeats[attacker.elementId];
    if (wins[0] === target.elementId || wins[1] === target.elementId) eMod = 120;
    else {
      const wins2 = elementBeats[target.elementId];
      if (wins2[0] === attacker.elementId || wins2[1] === attacker.elementId) eMod = 80;
    }
    // Daño final
    const dmg = Math.floor((base * wMod * eMod) / 10000);
    // Aplicar daño en memory
    target.hp = Math.max(target.hp - dmg, 0);

    // Log descriptivo
    log.push(
      `Turno ${idx + 1}: ${attacker.name} (spd ${attacker.speed}) ataca a ${target.name}` +
      ` base=${base}, arma*${wMod / 100}, elem*${eMod / 100} → dmg=${dmg}, queda HP=${target.hp}`
    );
  }
  log.push('🏁 Ronda finalizada.');
  return log;
}

