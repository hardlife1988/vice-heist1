import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { SymbolType } from '../game/GameLogic';

interface SymbolMeshProps {
  type: SymbolType;
  position?: [number, number, number];
  winning?: boolean;
}

const materials = {
  W: new THREE.MeshPhysicalMaterial({ color: '#FFD700', emissive: '#FFA500', emissiveIntensity: 2, metalness: 1, roughness: 0.1 }),
  SC: new THREE.MeshStandardMaterial({ color: '#8B4513', metalness: 0.8, roughness: 0.4 }),
  BV: new THREE.MeshStandardMaterial({ color: '#C0C0C0', metalness: 1, roughness: 0.2 }),
  H1: new THREE.MeshPhysicalMaterial({ color: '#00F5FF', transmission: 0.9, thickness: 1, roughness: 0.1, ior: 2.5 }),
  H2: new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 1, roughness: 0.2 }),
  H3: new THREE.MeshStandardMaterial({ color: '#228B22', roughness: 0.8 }),
  H4: new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.9 }),
  H5: new THREE.MeshStandardMaterial({ color: '#404040', metalness: 0.8, roughness: 0.5 }),
  A: new THREE.MeshStandardMaterial({ color: '#FF006E', metalness: 0.5, roughness: 0.2 }),
  K: new THREE.MeshStandardMaterial({ color: '#9D00FF', metalness: 0.5, roughness: 0.2 }),
  Q: new THREE.MeshStandardMaterial({ color: '#00F5FF', metalness: 0.5, roughness: 0.2 }),
  J: new THREE.MeshStandardMaterial({ color: '#FF9500', metalness: 0.5, roughness: 0.2 }),
};

const geometries = {
  W: new THREE.SphereGeometry(0.6, 32, 32),
  SC: new THREE.BoxGeometry(1, 0.8, 1),
  BV: new THREE.CylinderGeometry(0.7, 0.7, 0.4, 32),
  H1: new THREE.OctahedronGeometry(0.6, 0),
  H2: new THREE.BoxGeometry(1.2, 0.4, 0.8),
  H3: new THREE.BoxGeometry(1, 0.6, 0.6),
  H4: new THREE.CylinderGeometry(0.5, 0.6, 1, 16),
  H5: new THREE.BoxGeometry(1.2, 1.2, 1),
  Card: new THREE.BoxGeometry(0.8, 1, 0.1),
};

export const SymbolMesh: React.FC<SymbolMeshProps> = ({ type, position = [0, 0, 0] }) => {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    if (type === 'W' || type === 'H1') {
      group.current.rotation.y += 0.02;
    }
  });

  const renderGeometry = () => {
    switch (type) {
      case 'W':
        return (
          <mesh geometry={geometries.W} material={materials.W}>
            <pointLight color="#FFD700" intensity={2} distance={2} />
          </mesh>
        );
      case 'SC':
        return <mesh geometry={geometries.SC} material={materials.SC} />;
      case 'BV':
        return (
          <mesh geometry={geometries.BV} material={materials.BV} rotation={[Math.PI/2, 0, 0]} />
        );
      case 'H1':
        return <mesh geometry={geometries.H1} material={materials.H1} />;
      case 'H2':
        return <mesh geometry={geometries.H2} material={materials.H2} />;
      case 'H3':
        return (
          <group>
            <mesh geometry={geometries.H3} material={materials.H3} position={[0,-0.2,0]}/>
            <mesh geometry={geometries.H3} material={materials.H3} position={[0.1,0,0]} rotation={[0,0.1,0]}/>
            <mesh geometry={geometries.H3} material={materials.H3} position={[-0.1,0.2,0]} rotation={[0,-0.1,0]}/>
          </group>
        );
      case 'H4':
        return <mesh geometry={geometries.H4} material={materials.H4} />;
      case 'H5':
        return <mesh geometry={geometries.H5} material={materials.H5} />;
      case 'A':
      case 'K':
      case 'Q':
      case 'J':
        return (
          <group>
            <mesh geometry={geometries.Card} material={materials[type]} />
            <Text position={[0, 0, 0.06]} fontSize={0.6} color="white" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" anchorX="center" anchorY="middle">
              {type}
            </Text>
          </group>
        );
    }
  };

  return (
    <group position={position} ref={group}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {renderGeometry()}
      </Float>
    </group>
  );
};
