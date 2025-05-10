import React, { useEffect, useState, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import characterAbi from '../../abi/Characters.json';
import PanelContainer from './PanelContainer';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

interface BirthDiceProps {
  contract: `0x${string}`;
  tokenId: string;
}

const STAT_LABELS = ['Health', 'Attack', 'SpAtk', 'Defense', 'SpDef', 'Speed'];
const mapToDieValue = (t: number, i: number): number => {
  if (t === 2) return i % 2 === 0 ? 1 : 2;
  if (t === 1) return i % 2 === 0 ? 3 : 4;
  return i % 2 === 0 ? 5 : 6;
};
const notchWave = (v: number, radius: number, depth: number) => {
  v = (1 / radius) * v;
  v = Math.PI * Math.max(-1, Math.min(1, v));
  return depth * (Math.cos(v) + 1);
};
function createBoxGeometry(params: {segments: number; edgeRadius: number; notchRadius: number; notchDepth: number;}) {
  const { segments, edgeRadius, notchRadius, notchDepth } = params;
  let boxGeo = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
  const pos = boxGeo.attributes.position;
  const half = 0.5 - edgeRadius;
  for (let i = 0; i < pos.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(pos, i);
    const sign = new THREE.Vector3(Math.sign(p.x), Math.sign(p.y), Math.sign(p.z)).multiplyScalar(half);
    const delta = p.clone().sub(sign);
    // bevel
    if (Math.abs(p.x) > half && Math.abs(p.y) > half && Math.abs(p.z) > half) {
      delta.normalize().multiplyScalar(edgeRadius);
      p.copy(sign).add(delta);
    } else if (Math.abs(p.x) > half && Math.abs(p.y) > half) {
      delta.z = 0; delta.normalize().multiplyScalar(edgeRadius);
      p.x = sign.x + delta.x; p.y = sign.y + delta.y;
    } else if (Math.abs(p.x) > half && Math.abs(p.z) > half) {
      delta.y = 0; delta.normalize().multiplyScalar(edgeRadius);
      p.x = sign.x + delta.x; p.z = sign.z + delta.z;
    } else if (Math.abs(p.y) > half && Math.abs(p.z) > half) {
      delta.x = 0; delta.normalize().multiplyScalar(edgeRadius);
      p.y = sign.y + delta.y; p.z = sign.z + delta.z;
    }
    // carve
    const carve = (a: number, b: number) => notchWave(a, notchRadius, notchDepth) * notchWave(b, notchRadius, notchDepth);
    const off = 0.23;
    if (p.y > half) p.y -= carve(p.x, p.z);
    if (p.x > half) p.x -= carve(p.y + off, p.z + off) + carve(p.y - off, p.z - off);
    if (p.z > half) p.z -= carve(p.x - off, p.y + off) + carve(p.x, p.y) + carve(p.x + off, p.y - off);
    if (p.z < -half) p.z += carve(p.x + off, p.y + off) + carve(p.x + off, p.y - off) + carve(p.x - off, p.y + off) + carve(p.x - off, p.y - off);
    if (p.x < -half) p.x += carve(p.y + off, p.z + off) + carve(p.y + off, p.z - off) + carve(p.y, p.z) + carve(p.y - off, p.z + off) + carve(p.y - off, p.z - off);
    if (p.y < -half) p.y += carve(p.x + off, p.z + off) + carve(p.x + off, p.z) + carve(p.x + off, p.z - off) + carve(p.x - off, p.z + off) + carve(p.x - off, p.z) + carve(p.x - off, p.z - off);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  boxGeo.deleteAttribute('normal'); boxGeo.deleteAttribute('uv');
  const merged = mergeVertices(boxGeo);
  merged.computeVertexNormals();
  return merged;
}
function createInnerGeometry(edgeRadius: number) {
  const size = 1 - 2 * edgeRadius;
  const base = new THREE.PlaneGeometry(size, size);
  const off = 0.48;
  const geoms = [
    base.clone().translate(0, 0, off),
    base.clone().translate(0, 0, -off),
    base.clone().rotateX(Math.PI / 2).translate(0, -off, 0),
    base.clone().rotateX(Math.PI / 2).translate(0, off, 0),
    base.clone().rotateY(Math.PI / 2).translate(-off, 0, 0),
    base.clone().rotateY(Math.PI / 2).translate(off, 0, 0),
  ];
  const merged = mergeGeometries(geoms, false);
  merged.computeVertexNormals();
  return merged;
}
const Die: React.FC<{ talents: number[] }> = ({ talents }) => {
  const params = useMemo(() => ({ segments: 50, edgeRadius: 0.07, notchRadius: 0.12, notchDepth: 0.1 }), []);
  const [outerGeo, innerGeo] = useMemo(() => [createBoxGeometry(params), createInnerGeometry(params.edgeRadius)], [params]);
  const materials = useMemo(() => talents.map((t, i) => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#dcdcdc'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, size - 12, size - 12);
    ctx.fillStyle = '#2b6cb0'; ctx.font = '36px serif'; ctx.textAlign = 'center'; ctx.fillText(STAT_LABELS[i], size / 2, 60);
    const pipCount = mapToDieValue(t, i);
    ctx.fillStyle = '#333';
    const center = size / 2; const offset = size / 4;
    const preset: Record<number, [number, number][]> = {
      1: [[center, center]],
      2: [[center - offset, center - offset], [center + offset, center + offset]],
      3: [[center - offset, center - offset], [center, center], [center + offset, center + offset]],
      4: [[center - offset, center - offset], [center - offset, center + offset], [center + offset, center - offset], [center + offset, center + offset]],
      5: [[center - offset, center - offset], [center - offset, center + offset], [center, center], [center + offset, center - offset], [center + offset, center + offset]],
      6: [[center - offset, center - offset], [center - offset, center], [center - offset, center + offset], [center + offset, center - offset], [center + offset, center], [center + offset, center + offset]],
    };
    const positions: [number, number][] = preset[pipCount] ?? [];
    positions.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); });
    return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.8, metalness: 0.1 });
  }), [talents]);
  const group = React.useRef<THREE.Group>(null!);
  useFrame(({ clock }) => { if (group.current) { group.current.rotation.x = clock.getElapsedTime() * 0.2; group.current.rotation.y = clock.getElapsedTime() * 0.3; }});
  return (
    <group ref={group} scale={[2.5, 2.5, 2.5]}>
      <mesh geometry={innerGeo as any} material={new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0, metalness: 0.1, side: THREE.DoubleSide })} />
      <mesh geometry={outerGeo as any} material={new THREE.MeshStandardMaterial({ color: '#ffffff'  })} />
      {STAT_LABELS.map((_, idx) => (
        <mesh key={idx} geometry={outerGeo as any} material={materials[idx]} />
      ))}
    </group>
  );
};
const BirthDice: React.FC<BirthDiceProps> = ({ contract, tokenId }) => {
  const [talents, setTalents] = useState<number[]>([]);
  const { data, isLoading, isError } = useReadContract({ address: contract, abi: characterAbi, functionName: 'getInfo', args: [BigInt(tokenId)] });
  useEffect(() => { if (!isLoading && !isError && data) { const arr = data as any[]; const raw = arr[6]; const parsed = Array.isArray(raw) ? raw.map((x: any) => Number(x.toString())) : []; setTalents(parsed); } }, [data, isLoading, isError]);
  return (
    <PanelContainer>
      <h4 className="text-white font-semibold mb-2">Birth Dice</h4>
      <div className="w-full h-80">
        <Canvas camera={{ position: [4,4,6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10,10,10]} intensity={0.8} />
          <OrbitControls enablePan={false} enableZoom={true} />
          {talents.length === 6 && <Die talents={talents} />}
        </Canvas>
      </div>
    </PanelContainer>
  );
};
export default BirthDice;







