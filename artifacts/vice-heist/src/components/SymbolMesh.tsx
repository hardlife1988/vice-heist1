import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { SymbolType } from '../game/GameLogic';

import wTex from '../assets/symbols/W.webp';
import scTex from '../assets/symbols/SC.webp';
import bvTex from '../assets/symbols/BV.webp';
import h1Tex from '../assets/symbols/H1.webp';
import h2Tex from '../assets/symbols/H2.webp';
import h3Tex from '../assets/symbols/H3.webp';
import h4Tex from '../assets/symbols/H4.webp';
import h5Tex from '../assets/symbols/H5.webp';
import aTex from '../assets/symbols/A.webp';
import kTex from '../assets/symbols/K.webp';
import qTex from '../assets/symbols/Q.webp';
import jTex from '../assets/symbols/J.webp';

interface SymbolMeshProps {
  type: SymbolType;
  position?: [number, number, number];
  winning?: boolean;
}

const TEXTURE_SOURCES: Record<SymbolType, string> = {
  W: wTex,
  SC: scTex,
  BV: bvTex,
  H1: h1Tex,
  H2: h2Tex,
  H3: h3Tex,
  H4: h4Tex,
  H5: h5Tex,
  A: aTex,
  K: kTex,
  Q: qTex,
  J: jTex,
};

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

function getTexture(src: string): THREE.Texture {
  let tex = textureCache.get(src);
  if (!tex) {
    tex = textureLoader.load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(src, tex);
  }
  return tex;
}

const planeGeometry = new THREE.PlaneGeometry(1.15, 1.15);

export const SymbolMesh: React.FC<SymbolMeshProps> = ({ type, position = [0, 0, 0], winning = false }) => {
  const group = useRef<THREE.Group>(null);
  const texture = getTexture(TEXTURE_SOURCES[type]);

  useFrame((state) => {
    if (!group.current) return;
    if (winning) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.08;
      group.current.scale.set(pulse, pulse, pulse);
    } else {
      group.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group position={position} ref={group}>
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.4}>
        <mesh geometry={planeGeometry}>
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
        {winning && (
          <pointLight color="#FFD700" intensity={1.5} distance={2} position={[0, 0, 0.3]} />
        )}
      </Float>
    </group>
  );
};
