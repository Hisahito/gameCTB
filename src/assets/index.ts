// src/assets/index.ts

// Asegúrate de tener declarado el módulo para archivos de imagen,
// por ejemplo, en un archivo de declaración global (global.d.ts):
// declare module '*.png';

import castilloImg from './castillo.png';
import cofreImg from './GrassChest.png';
import pastoImg from './pasto3.png';
import aguaImg from './water.png';
import bosqueImg from './bosque.png';
import piedraImg from './BlockRock1.png';
import blockWoodsImg from './blockWoods.png';
import soldierIdleImg from './Soldier-Idle.png';
import blockRockImg from './BlockRock1.png';
import nightBlockImg from './NightBlock1.png';
import grassChestImg from './GrassChest.png';
import grass2Img from './Grass2.png';
import grass3Img from './Grass3.png';
import woods1Img from './Woods1.png';
import woods2Img from './Woods2.png';
import woods3Img from './Woods3.png';

interface Images {
  [key: string]: string;
}

const images: Images = {
  castillo: castilloImg,
  cofre: cofreImg,
  pasto: pastoImg,
  agua: aguaImg,
  bosque: bosqueImg,
  piedra: piedraImg,
  blockWoods: blockWoodsImg,
  soldierIdle: soldierIdleImg,
  blockRock: blockRockImg,
  nightBlock: nightBlockImg,
  grassChest: grassChestImg,
  grass2: grass2Img,
  grass3: grass3Img,
  woods1: woods1Img,
  woods2: woods2Img,
  woods3: woods3Img,
};

export default images;
