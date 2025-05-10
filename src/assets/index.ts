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
import grass4Img from './Grass4.png';
import grass5Img from './Grass5.png';
import tower1Img from './Tower1.png';
import woods1Img from './Woods1.png';
import woods2Img from './Woods2.png';
import woods3Img from './Woods3.png';
import bunny from './Coneja.png';
import grasshd from './grasshd.png';
import pine from './pine.png';
import mage from './mage2.png'
import mage2 from './mage3.png'
import mage4 from './mage4.png'
import elf from './blueelf.png'
import grassia from './grassia.png'

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
  grass4: grass4Img,
  grass5: grass5Img,
  tower1: tower1Img,
  woods1: woods1Img,
  woods2: woods2Img,
  woods3: woods3Img,
  bunny: bunny,
  grasshd: grasshd,
  pine: pine,
  mage: mage,
  mage2: mage2,
  mage4: mage4,
  elf: elf,
  grassia: grassia,
};

export default images;
