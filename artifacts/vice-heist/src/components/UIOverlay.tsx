import React, { useState } from 'react';
import { useGameStore } from '../hooks/useGameState';
import { Volume2, VolumeX, Info } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

export const UIOverlay: React.FC = () => {
  const { balance, bet, isSpinning, currentWin, freeSpins, isAutoSpin, spin, setBet, toggleAutoSpin, initAudio } = useGameStore();
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const bets = [0.2, 0.4, 1.0, 2.0, 5.0];

  const handleMuteToggle = () => {
    initAudio();
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const handleFirstInteraction = () => {
    initAudio();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10" onClick={handleFirstInteraction}>
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/80 border border-primary/30 rounded px-6 py-2 box-shadow-neon-pink">
          <p className="text-primary font-mono text-xs uppercase tracking-widest">Balance</p>
          <p className="text-white font-mono text-xl">${balance.toFixed(2)}</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="w-10 h-10 bg-black/80 border border-secondary/30 rounded flex items-center justify-center text-secondary hover:bg-secondary/20 transition-colors"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={handleMuteToggle}
            className="w-10 h-10 bg-black/80 border border-secondary/30 rounded flex items-center justify-center text-secondary hover:bg-secondary/20 transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Free Spins Overlay */}
      {freeSpins > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/90 border border-secondary px-8 py-3 rounded-full box-shadow-neon-cyan animate-pulse">
            <p className="text-secondary font-mono text-2xl font-bold text-shadow-neon-cyan">
              FREE SPINS: {freeSpins}
            </p>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 bg-black/90 z-50 pointer-events-auto flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-card border border-primary/50 rounded-xl p-8 relative box-shadow-neon-pink">
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-white hover:text-primary"
            >
              Close
            </button>
            <h2 className="text-3xl font-bold text-primary mb-6 text-shadow-neon-pink uppercase tracking-widest">Paytable</h2>
            <div className="grid grid-cols-2 gap-4 text-white font-mono text-sm">
              <div>
                <h3 className="text-secondary mb-2 border-b border-secondary/30 pb-1">High Pays</h3>
                <p>Wild: 5x=79.5, 4x=4.28</p>
                <p>H1 Diamond: 5x=16</p>
                <p>H2 Gold Bar: 5x=12</p>
                <p>H3 Cash Stack: 5x=8</p>
                <p>H4 Bag: 5x=6</p>
                <p>H5 Vault: 5x=4</p>
              </div>
              <div>
                <h3 className="text-secondary mb-2 border-b border-secondary/30 pb-1">Low Pays</h3>
                <p>A: 5x=3</p>
                <p>K: 5x=2.5</p>
                <p>Q: 5x=2</p>
                <p>J: 5x=1.5</p>
                <p className="mt-4 text-accent">Scatter: 3+ Triggers Free Spins</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="flex justify-between items-end pointer-events-auto pb-4 px-4 bg-gradient-to-t from-black/80 to-transparent -mx-4">
        
        {/* Bet Controls */}
        <div className="bg-black/80 border border-primary/30 rounded px-4 py-2 flex flex-col gap-2">
          <p className="text-primary font-mono text-xs uppercase tracking-widest text-center">Bet</p>
          <div className="flex items-center gap-3">
            <button 
              className="text-white hover:text-primary disabled:opacity-50"
              onClick={() => setBet(bets[Math.max(0, bets.indexOf(bet) - 1)])}
              disabled={isSpinning || bets.indexOf(bet) === 0}
            >
              -
            </button>
            <span className="text-white font-mono text-lg w-16 text-center">${bet.toFixed(2)}</span>
            <button 
              className="text-white hover:text-primary disabled:opacity-50"
              onClick={() => setBet(bets[Math.min(bets.length - 1, bets.indexOf(bet) + 1)])}
              disabled={isSpinning || bets.indexOf(bet) === bets.length - 1}
            >
              +
            </button>
          </div>
        </div>

        {/* Center: Win Display & Spin Button */}
        <div className="flex flex-col items-center gap-4">
          <div className={`h-12 flex items-center justify-center transition-opacity duration-300 ${currentWin > 0 ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-accent font-mono text-2xl font-bold box-shadow-neon-gold bg-black/60 px-6 py-2 rounded border border-accent">
              WIN: ${currentWin.toFixed(2)}
            </p>
          </div>
          
          <button
            onClick={() => { initAudio(); spin(); }}
            disabled={isSpinning}
            className={`
              w-32 h-32 rounded-full border-4 border-accent bg-black/80 flex items-center justify-center
              transition-all duration-200 uppercase font-black text-2xl tracking-widest
              ${isSpinning 
                ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-500' 
                : 'text-accent hover:scale-105 hover:bg-accent/10 box-shadow-neon-gold text-shadow-neon-pink'
              }
            `}
          >
            Spin
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/80 border border-secondary/30 rounded px-4 py-2 text-center">
            <p className="text-secondary font-mono text-xs uppercase tracking-widest">Lines</p>
            <p className="text-white font-mono text-lg">20</p>
          </div>
          <button
            onClick={() => { initAudio(); toggleAutoSpin(); }}
            className={`
              border rounded px-4 py-2 font-mono uppercase tracking-widest transition-colors
              ${isAutoSpin 
                ? 'bg-secondary text-black border-secondary box-shadow-neon-cyan' 
                : 'bg-black/80 text-secondary border-secondary/30 hover:bg-secondary/20'
              }
            `}
          >
            {isAutoSpin ? 'Stop Auto' : 'Auto'}
          </button>
        </div>

      </div>
    </div>
  );
};
