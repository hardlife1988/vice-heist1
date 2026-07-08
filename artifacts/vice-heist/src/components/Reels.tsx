import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { SymbolType, SYMBOLS } from '../game/GameLogic';
import { SymbolMesh } from './SymbolMesh';
import { useGameStore } from '../hooks/useGameState';
import { audio } from '../audio/AudioEngine';

const REEL_RADIUS = 3;
const SYMBOLS_PER_REEL = 16;
const SYMBOL_ANGLE = (2 * Math.PI) / SYMBOLS_PER_REEL;

// Generate random strips once per reel; mutated only via ref — never during render
const generateStrip = (): SymbolType[] =>
  Array.from({ length: SYMBOLS_PER_REEL }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

export const Reels: React.FC = () => {
  const isSpinning   = useGameStore((state) => state.isSpinning);
  const targetGrid   = useGameStore((state) => state.targetGrid);
  const spinId       = useGameStore((state) => state.spinId);
  const onReelsStopped = useGameStore((state) => state.onReelsStopped);
  const winLines     = useGameStore((state) => state.winLines);
  const displayGrid  = useGameStore((state) => state.grid);

  const reelRefs     = useRef<(THREE.Group | null)[]>([null, null, null, null, null]);
  // Strips are refs so mutations don't trigger re-renders
  const stripsRef    = useRef<SymbolType[][]>(Array.from({ length: 5 }, () => generateStrip()));
  const spinTweens   = useRef<(gsap.core.Tween | null)[]>([null, null, null, null, null]);
  const currentAngles = useRef([0, 0, 0, 0, 0]);
  // Track which spinId the current animation was launched for
  const animatingSpinId = useRef(-1);
  // Local copy for render (force update trick)
  const [, forceUpdate] = React.useState(0);
  const stripsSnapshot = useRef<SymbolType[][]>(stripsRef.current.map((s) => [...s]));

  useEffect(() => {
    if (!isSpinning) return;
    if (animatingSpinId.current === spinId) return; // already launched
    animatingSpinId.current = spinId;

    // Kill any running tweens
    spinTweens.current.forEach((t) => t?.kill());

    reelRefs.current.forEach((reel, i) => {
      if (!reel) return;

      // --- Determine landing position -----------------------------------------
      const extraRotations = 3 + i; // stagger: reel 0 does 3 full turns, reel 4 does 7
      const totalAngle     = extraRotations * Math.PI * 2;
      const targetAngle    = currentAngles.current[i] + totalAngle;
      const landingIndex   = Math.round(targetAngle / SYMBOL_ANGLE) % SYMBOLS_PER_REEL;

      // Embed targetGrid symbols at the landing positions so the correct symbols
      // are visible when the reel stops.  This is done once before animation
      // starts — no mid-spin strip mutations.
      for (let row = 0; row < 3; row++) {
        const idx = ((landingIndex + (1 - row)) % SYMBOLS_PER_REEL + SYMBOLS_PER_REEL) % SYMBOLS_PER_REEL;
        stripsRef.current[i][idx] = targetGrid[i][row];
      }

      spinTweens.current[i] = gsap.to(reel.rotation, {
        x: -targetAngle,
        duration: 2 + i * 0.25,
        ease: 'back.out(0.8)',
        onUpdate: () => {
          currentAngles.current[i] = -reel.rotation.x;
        },
        onComplete: () => {
          audio.playReelStop();
          if (i === 4) {
            // Take a fresh snapshot for rendering then notify store
            stripsSnapshot.current = stripsRef.current.map((s) => [...s]);
            forceUpdate((n) => n + 1);
            onReelsStopped(spinId);
          }
        },
      });
    });

    // Snapshot strips after mutation so current render is consistent
    stripsSnapshot.current = stripsRef.current.map((s) => [...s]);
    forceUpdate((n) => n + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, spinId]);

  // Winning position set for glow highlights
  const winSet = useMemo(
    () => new Set(winLines.flatMap((l) => l.positions.map((p) => `${p.reel}-${p.row}`))),
    [winLines],
  );

  // Use displayGrid (finalized by store) while idle; use strip symbols while spinning
  const renderStrips = isSpinning ? stripsSnapshot.current : null;

  return (
    <group position={[0, 0, 0]}>
      {/* 5 Reels */}
      {Array.from({ length: 5 }, (_, i) => (
        <group
          key={i}
          position={[(i - 2) * 1.8, 0, -REEL_RADIUS + 3]}
          ref={(el) => { reelRefs.current[i] = el; }}
        >
          {/* Drum cylinder */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[REEL_RADIUS - 0.2, REEL_RADIUS - 0.2, 1.6, 32]} />
            <meshStandardMaterial color="#0A0A0A" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Symbols on drum */}
          {(renderStrips ?? stripsRef.current)[i].map((symbol, sIdx) => (
            <group key={sIdx} rotation={[sIdx * SYMBOL_ANGLE, 0, 0]}>
              <group position={[0, 0, REEL_RADIUS]}>
                <SymbolMesh type={symbol as SymbolType} />
              </group>
            </group>
          ))}
        </group>
      ))}

      {/* Chrome separators */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x * 1.8, 0, 2.8]}>
          <boxGeometry args={[0.1, 4.5, 0.2]} />
          <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
        </mesh>
      ))}

      {/* Win highlight frames */}
      {!isSpinning && winLines.map((line, idx) =>
        line.positions.map((pos, pIdx) => (
          <mesh key={`${idx}-${pIdx}`} position={[(pos.reel - 2) * 1.8, (1 - pos.row) * 1.5, 3.2]}>
            <boxGeometry args={[1.6, 1.4, 0.1]} />
            <meshBasicMaterial color="#FF006E" wireframe transparent opacity={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
};
