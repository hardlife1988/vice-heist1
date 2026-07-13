import ambientLoopUrl from '../assets/audio/ambient-loop.mp3';
import winJingleUrl from '../assets/audio/win-jingle.mp3';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private ambientNodes: AudioNode[] = [];  // all nodes we've started
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientBuffer: AudioBuffer | null = null;
  private winJingleBuffer: AudioBuffer | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.startAmbientLoop();
    this.preloadWinJingle();
  }

  /** Stop and release all audio resources. Safe to call multiple times. */
  dispose() {
    this.ambientNodes.forEach((n) => {
      try {
        if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) n.stop();
        n.disconnect();
      } catch { /* already stopped */ }
    });
    this.ambientNodes = [];
    this.ambientGain = null;
    this.ambientSource = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.05,
        this.ctx.currentTime,
        0.5,
      );
    }
    return this.isMuted;
  }

  /** Ambient heist-noir background loop, decoded from the recorded music track. */
  private async startAmbientLoop() {
    if (!this.ctx) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.isMuted ? 0 : 0.05;
    this.ambientGain.connect(this.ctx.destination);
    this.ambientNodes.push(this.ambientGain);

    try {
      const res = await fetch(ambientLoopUrl);
      const arrayBuffer = await res.arrayBuffer();
      this.ambientBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      if (!this.ctx || !this.ambientGain) return; // disposed while loading

      const source = this.ctx.createBufferSource();
      source.buffer = this.ambientBuffer;
      source.loop = true;
      source.connect(this.ambientGain);
      source.start();

      this.ambientSource = source;
      this.ambientNodes.push(source);
    } catch {
      // If decoding/loading fails (unsupported format, network hiccup), stay silent
      // rather than falling back to the old synthesized drone.
    }
  }

  private async preloadWinJingle() {
    if (!this.ctx) return;
    try {
      const res = await fetch(winJingleUrl);
      const arrayBuffer = await res.arrayBuffer();
      this.winJingleBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch {
      // fall back to the synthesized arpeggio in playWinBig() if this never loads
    }
  }

  playSpinStart() {
    if (this.isMuted || !this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playReelStop() {
    if (this.isMuted || !this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playWinSmall() {
    if (this.isMuted || !this.ctx) return;
    [440, 554.37, 659.25].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
      }, i * 100);
    });
  }

  playWinBig() {
    if (this.isMuted || !this.ctx) return;

    // Prefer the recorded brass/cash-register win jingle; fall back to the
    // synthesized arpeggio below if it hasn't finished loading yet.
    if (this.winJingleBuffer) {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = this.winJingleBuffer;
      gain.gain.value = 0.4;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();
      return;
    }

    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.5);
      }, i * 150);
    });
  }

  playButtonClick() {
    if (this.isMuted || !this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const audio = new AudioEngine();

// Clean up on page unload so AudioContext is released
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => audio.dispose(), { once: true });
}
