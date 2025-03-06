// utils/textureUtils.ts
export function randomFromSeed(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  export function getDeterministicTexture(
    textures: Array<{ key: string; probability: number }>,
    seed: number
  ): string {
    const totalProbability = textures.reduce((acc, curr) => acc + curr.probability, 0);
    const random = randomFromSeed(seed) * totalProbability;
    let sum = 0;
    for (const texture of textures) {
      sum += texture.probability;
      if (random < sum) {
        return texture.key;
      }
    }
    return textures[0].key; // fallback
  }
  