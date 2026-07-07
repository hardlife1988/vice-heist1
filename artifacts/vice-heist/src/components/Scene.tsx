import React from 'react';
import { Background } from './Background';
import { Cabinet } from './Cabinet';
import { Reels } from './Reels';
import { useGameStore } from '../hooks/useGameState';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Scene: React.FC = () => {
  const isSpinning = useGameStore((state) => state.isSpinning);

  useFrame((state) => {
    // Subtle camera bob when idle
    if (!isSpinning) {
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, Math.sin(state.clock.elapsedTime * 0.5) * 0.2, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, Math.sin(state.clock.elapsedTime * 0.3) * 0.1, 0.05);
      state.camera.lookAt(0, 0, 0);
    } else {
      // Snap to center during spin
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.1);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, 0.1);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <Background />
      <Cabinet>
        <Reels />
      </Cabinet>
    </>
  );
};
