import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const Cabinet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const marqueeRef = useRef<THREE.Group>(null);
  const glowMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (glowMaterialRef.current) {
      glowMaterialRef.current.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 4);
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Main Body */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[11, 7.5, 3]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Golden Trim Outer */}
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[11.2, 7.7, 0.2]} />
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
      </mesh>

      {/* Inner Screen Bezel */}
      <mesh position={[0, -0.2, 1.05]}>
        <boxGeometry args={[9.4, 4.8, 0.2]} />
        <meshStandardMaterial color="#0A0A0A" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Glass Panel overlaying reels */}
      <mesh position={[0, -0.2, 3.5]}>
        <planeGeometry args={[9, 4.5]} />
        <meshPhysicalMaterial 
          transmission={0.95} 
          roughness={0.1} 
          thickness={0.5} 
          transparent
          opacity={0.3}
          color="#aeeeee"
        />
      </mesh>

      {/* Top Marquee Area */}
      <group position={[0, 3, 1]} ref={marqueeRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[10, 1.2, 0.3]} />
          <meshStandardMaterial color="#000" metalness={0.8} roughness={0.8} />
        </mesh>
        
        {/* Neon text */}
        <Text 
          position={[0, 0, 0.2]} 
          fontSize={0.8} 
          font="https://fonts.gstatic.com/s/syncopate/v19/pe0sMIuPIYBCpEV5eFdCBfe_.woff2"
          color="#FF006E"
          anchorX="center"
          anchorY="middle"
        >
          VICE HEIST
          <meshStandardMaterial ref={glowMaterialRef} color="#FF006E" emissive="#FF006E" emissiveIntensity={2} />
        </Text>
      </group>

      {/* Side Speaker Grilles */}
      {[-4.8, 4.8].map((x, i) => (
        <group key={i} position={[x, -2, 1.1]}>
          {Array.from({ length: 15 }).map((_, j) => (
            <mesh key={j} position={[0, j * 0.15 - 1, 0]}>
              <boxGeometry args={[0.5, 0.05, 0.1]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Coin Tray Bottom */}
      <mesh position={[0, -3.5, 1.5]} rotation={[Math.PI / 8, 0, 0]}>
        <boxGeometry args={[10, 1, 1]} />
        <meshStandardMaterial color="#C0C0C0" metalness={1} roughness={0.2} />
      </mesh>

      {/* Insert Reels inside cabinet */}
      {children}
    </group>
  );
};
