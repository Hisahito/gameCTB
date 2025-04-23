// src/data/rangePatterns.ts

export interface Offset {
    dx: number;
    dy: number;
  }
  
  export type RangePattern = Offset[];
  
  // 🔵 Cuerpo a cuerpo simple (adyacente)
  export const meleePattern: RangePattern = [
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
  ];
  
  // 🟣 Arquero estilo Fire Emblem (solo en radio 2)
  export const archerPattern: RangePattern = [
    { dx: 0, dy: 2 },
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
  ];
  
  // 🔴 Mago (en cruz y diagonales a 1 bloque)
  export const magePattern: RangePattern = [
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
  ];
  
  // 🟡 Área completa en diamante dentro de 2 de distancia (usado en general)
  export const diamondRange = (radius: number): RangePattern => {
    const pattern: Offset[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) + Math.abs(dy) <= radius && (dx !== 0 || dy !== 0)) {
          pattern.push({ dx, dy });
        }
      }
    }
    return pattern;
  };
  