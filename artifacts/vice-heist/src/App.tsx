import React, { Suspense, Component, type ReactNode, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { useGameStore } from './hooks/useGameState';
import { SymbolType } from './game/GameLogic';

const queryClient = new QueryClient();

// ── WebGL Error Boundary ─────────────────────────────────────────────────────
interface BoundaryState { hasError: boolean }
class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, BoundaryState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ── CSS 2D Fallback Reel ─────────────────────────────────────────────────────
const SYMBOL_META: Record<SymbolType, { label: string; color: string; bg: string }> = {
  W:  { label: 'W',  color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
  SC: { label: 'SC', color: '#CD7F32', bg: 'rgba(205,127,50,0.15)' },
  BV: { label: 'BV', color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)' },
  H1: { label: '◆',  color: '#00F5FF', bg: 'rgba(0,245,255,0.15)' },
  H2: { label: '▬',  color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
  H3: { label: '$',  color: '#00C853', bg: 'rgba(0,200,83,0.15)' },
  H4: { label: '⌂',  color: '#9E9E9E', bg: 'rgba(158,158,158,0.1)' },
  H5: { label: '⊡',  color: '#607D8B', bg: 'rgba(96,125,139,0.1)' },
  A:  { label: 'A',  color: '#FF006E', bg: 'rgba(255,0,110,0.12)' },
  K:  { label: 'K',  color: '#9D00FF', bg: 'rgba(157,0,255,0.12)' },
  Q:  { label: 'Q',  color: '#00F5FF', bg: 'rgba(0,245,255,0.12)' },
  J:  { label: 'J',  color: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
};

function SymbolCell({ sym, winning }: { sym: SymbolType; winning?: boolean }) {
  const meta = SYMBOL_META[sym];
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: winning ? meta.bg : 'rgba(10,10,20,0.8)',
      border: `1px solid ${winning ? meta.color : 'rgba(255,255,255,0.08)'}`,
      boxShadow: winning ? `0 0 12px ${meta.color}, inset 0 0 8px ${meta.color}40` : 'none',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      fontSize: '1.5rem',
      fontWeight: 900,
      fontFamily: 'Space Mono, monospace',
      color: meta.color,
      textShadow: winning ? `0 0 10px ${meta.color}` : 'none',
      letterSpacing: '0.05em',
    }}>
      {meta.label}
    </div>
  );
}

function CSSFallback() {
  const { balance, bet, isSpinning, currentWin, freeSpins, grid, winLines, spin, setBet, initAudio } = useGameStore();
  const bets = [0.2, 0.4, 1.0, 2.0, 5.0];
  const rainRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Animated rain canvas
  useEffect(() => {
    const canvas = rainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const drops: { x: number; y: number; len: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 180; i++) {
      drops.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, len: 10 + Math.random() * 20, speed: 3 + Math.random() * 5, opacity: 0.1 + Math.random() * 0.3 });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drops.forEach(d => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.1, d.y + d.len);
        ctx.strokeStyle = `rgba(0, 245, 255, ${d.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        d.y += d.speed;
        d.x -= d.speed * 0.1;
        if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  // Neon city skyline canvas
  const skylineRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = skylineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const buildings: { x: number; w: number; h: number; color: string }[] = [];
    for (let i = 0; i < 35; i++) {
      buildings.push({ x: i * (window.innerWidth / 34), w: window.innerWidth / 30 + Math.random() * 60, h: 80 + Math.random() * 220, color: Math.random() > 0.5 ? '#FF006E' : '#00F5FF' });
    }

    const h = canvas.height;
    buildings.forEach(b => {
      ctx.fillStyle = '#07070f';
      ctx.fillRect(b.x, h - b.h, b.w, b.h);
      ctx.strokeStyle = b.color + '44';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, h - b.h, b.w, b.h);
      // windows
      for (let wy = h - b.h + 8; wy < h - 8; wy += 16) {
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 12) {
          if (Math.random() > 0.5) {
            ctx.fillStyle = b.color + (Math.random() > 0.5 ? '88' : '22');
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
    });
  }, []);

  const winningPositions = new Set(winLines.flatMap(l => l.positions.map(p => `${p.reel}-${p.row}`)));

  const handleSpin = useCallback(() => { initAudio(); spin(); }, [initAudio, spin]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', background: '#050510', fontFamily: 'Space Mono, monospace', userSelect: 'none' }}>
      {/* Sky + city */}
      <canvas ref={skylineRef} style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
      {/* Rain */}
      <canvas ref={rainRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Radial ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(255,0,110,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Top bar ───────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,0,110,0.4)', borderRadius: 8, padding: '8px 20px', boxShadow: '0 0 12px rgba(255,0,110,0.3)' }}>
          <div style={{ color: '#FF006E', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Balance</div>
          <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>${balance.toFixed(2)}</div>
        </div>
        {freeSpins > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.9)', border: '2px solid #00F5FF', borderRadius: 40, padding: '8px 28px', boxShadow: '0 0 20px #00F5FF80', animation: 'pulse 1s infinite' }}>
            <span style={{ color: '#00F5FF', fontSize: '1rem', fontWeight: 900, letterSpacing: '0.15em' }}>FREE SPINS: {freeSpins}</span>
          </div>
        )}
      </div>

      {/* ── Cabinet ───────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -48%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, zIndex: 5 }}>
        {/* Marquee */}
        <div style={{ background: 'rgba(0,0,0,0.95)', border: '2px solid #FFD700', borderBottom: 'none', borderRadius: '12px 12px 0 0', padding: '10px 48px', boxShadow: '0 0 30px rgba(255,0,110,0.5), 0 0 60px rgba(255,0,110,0.2)', minWidth: 500 }}>
          <div style={{ textAlign: 'center', color: '#FF006E', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', textShadow: '0 0 20px #FF006E, 0 0 40px #FF006E88' }}>
            VICE HEIST
          </div>
        </div>

        {/* Reel window */}
        <div style={{ background: 'rgba(0,0,0,0.95)', border: '2px solid #FFD700', padding: '12px', boxShadow: '0 0 40px rgba(255,215,0,0.3), inset 0 0 30px rgba(0,0,0,0.8)', position: 'relative' }}>
          {/* Inner bezel glow */}
          <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(255,215,0,0.2)', borderRadius: 4, pointerEvents: 'none', zIndex: 2 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 90px)', gridTemplateRows: 'repeat(3, 80px)', gap: 4 }}>
            {Array.from({ length: 5 }, (_, reel) =>
              Array.from({ length: 3 }, (_, row) => (
                <SymbolCell
                  key={`${reel}-${row}`}
                  sym={grid[reel]?.[row] ?? 'J'}
                  winning={winningPositions.has(`${reel}-${row}`)}
                />
              ))
            )}
          </div>

          {/* Glass overlay effect */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,245,255,0.02) 100%)', pointerEvents: 'none', borderRadius: 4 }} />

          {/* Reel separators */}
          {[1,2,3,4].map(i => (
            <div key={i} style={{ position: 'absolute', left: `calc(${i * 94 + 12}px)`, top: 12, bottom: 12, width: 2, background: 'linear-gradient(to bottom, transparent, #FFD700, transparent)', opacity: 0.6 }} />
          ))}
        </div>

        {/* Bottom cabinet trim */}
        <div style={{ background: 'rgba(0,0,0,0.95)', border: '2px solid #FFD700', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '6px 48px', minWidth: 500, boxShadow: '0 4px 20px rgba(255,215,0,0.2)' }}>
          <div style={{ height: 4, background: 'linear-gradient(to right, transparent, #C0C0C0, transparent)', borderRadius: 2, opacity: 0.5 }} />
        </div>
      </div>

      {/* ── Win display ───────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)', zIndex: 10, minHeight: 40, display: 'flex', alignItems: 'center' }}>
        {currentWin > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #FFD700', borderRadius: 8, padding: '6px 24px', boxShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
            <span style={{ color: '#FFD700', fontSize: '1.3rem', fontWeight: 900, textShadow: '0 0 10px #FFD700' }}>WIN: ${currentWin.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* ── Bottom controls ───────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 24px 24px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
        {/* Bet */}
        <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,0,110,0.4)', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ color: '#FF006E', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Bet</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setBet(bets[Math.max(0, bets.indexOf(bet) - 1)])} disabled={isSpinning || bets.indexOf(bet) === 0}
              style={{ color: '#FF006E', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900, opacity: isSpinning || bets.indexOf(bet) === 0 ? 0.3 : 1 }}>-</button>
            <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, width: 60, textAlign: 'center' }}>${bet.toFixed(2)}</span>
            <button onClick={() => setBet(bets[Math.min(bets.length - 1, bets.indexOf(bet) + 1)])} disabled={isSpinning || bets.indexOf(bet) === bets.length - 1}
              style={{ color: '#FF006E', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900, opacity: isSpinning || bets.indexOf(bet) === bets.length - 1 ? 0.3 : 1 }}>+</button>
          </div>
        </div>

        {/* Spin button */}
        <button onClick={handleSpin} disabled={isSpinning}
          style={{ width: 110, height: 110, borderRadius: '50%', border: `3px solid ${isSpinning ? '#555' : '#FFD700'}`, background: 'rgba(0,0,0,0.9)', color: isSpinning ? '#555' : '#FFD700', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.15em', cursor: isSpinning ? 'not-allowed' : 'pointer', boxShadow: isSpinning ? 'none' : '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3)', transition: 'all 0.2s', transform: isSpinning ? 'scale(0.95)' : 'scale(1)', textTransform: 'uppercase' }}>
          {isSpinning ? '...' : 'SPIN'}
        </button>

        {/* Lines / Auto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ color: '#00F5FF', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Lines</div>
            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>20</div>
          </div>
          <button onClick={() => {}} style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 8, padding: '8px 16px', color: '#00F5FF', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            AUTO
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WebGL detection (runs once synchronously before any Three.js loads) ──────
const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(
      typeof WebGLRenderingContext !== 'undefined' &&
      (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
})();

// ── Main App ─────────────────────────────────────────────────────────────────
function ThreeDGame() {
  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-[#FF006E] font-mono text-xl animate-pulse"
          style={{ textShadow: '0 0 20px #FF006E' }}>
          LOADING VICE HEIST...
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60 }}
          gl={{ antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </Suspense>
      <UIOverlay />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {hasWebGL ? (
        <WebGLErrorBoundary fallback={<CSSFallback />}>
          <ThreeDGame />
        </WebGLErrorBoundary>
      ) : (
        <CSSFallback />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
