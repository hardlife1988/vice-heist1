import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';

// Building data generated once at module level — stable across renders
const BUILDING_DATA = Array.from({ length: 30 }, (_, i) => ({
  height: 5 + ((i * 7919 + 13) % 1000) / 66.6,   // deterministic pseudo-random
  width:  2 + ((i * 6271 + 7)  % 1000) / 333,
  x: (i - 15) * 4,
  neonColor: i % 2 === 0 ? '#FF006E' : '#00F5FF',
}));

export const Background: React.FC = () => {
  const rainRef = useRef<THREE.Points>(null);
  const cityRef = useRef<THREE.Group>(null);

  // Rain particles — Float32Array created once, mutated in place each frame
  const { rainPositions, rainCount } = useMemo(() => {
    const rainCount = 5000;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3]     = (Math.random() - 0.5) * 40;
      rainPositions[i * 3 + 1] = Math.random() * 20;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;
    }
    return { rainPositions, rainCount };
  }, []);

  // All building geometries memoised — never rebuilt on re-render
  const buildingMeshes = useMemo(() => BUILDING_DATA.map((b) => {
    const geo = new THREE.BoxGeometry(b.width, b.height, 2);
    return { ...b, geo, edgeGeo: new THREE.EdgesGeometry(geo) };
  }), []);

  useFrame(() => {
    if (rainRef.current) {
      const pos = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        pos[i * 3 + 1] -= 0.2;
        pos[i * 3]     -= 0.02;
        if (pos[i * 3 + 1] < -5) {
          pos[i * 3 + 1] = 20;
          pos[i * 3]     = (Math.random() - 0.5) * 40;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (cityRef.current) {
      cityRef.current.position.x = Math.sin(Date.now() * 0.0001) * 0.5;
    }
  });

  return (
    <group>
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 10, 40]} />

      {/* Rain */}
      <points ref={rainRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rainPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#00F5FF" size={0.05} transparent opacity={0.4} />
      </points>

      {/* City skyline with memoised geometries */}
      <group ref={cityRef} position={[0, -2, -20]}>
        {buildingMeshes.map((b, i) => (
          <group key={i} position={[b.x, b.height / 2, 0]}>
            <mesh geometry={b.geo}>
              <meshStandardMaterial color="#020205" metalness={0.5} roughness={0.8} />
            </mesh>
            <lineSegments geometry={b.edgeGeo}>
              <lineBasicMaterial color={b.neonColor} transparent opacity={0.2} />
            </lineSegments>
          </group>
        ))}
      </group>

      {/* Reflective wet ground */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Ambient particles */}
      <Sparkles count={200} scale={20} size={2} speed={0.4} opacity={0.2} color="#FF006E" />

      {/* Cinematic lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 10, 5]} intensity={1} color="#FFD700" />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} color="#00F5FF" castShadow />
      <pointLight position={[-5, 2, 2]} intensity={2} color="#FF006E" distance={15} />
      <pointLight position={[5, 2, 2]}  intensity={2} color="#00F5FF" distance={15} />
    </group>
  );
};
