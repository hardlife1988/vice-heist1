class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private ambientNodes: AudioNode[] = [];  // all nodes we've started
  private ambientGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.startAmbientLoop();
  }

  /** Stop and release all audio resources. Safe to call multiple times. */
  dispose() {
    this.ambientNodes.forEach((n) => {
      try {
        if (n instanceof OscillatorNode) n.stop();
        n.disconnect();
      } catch { /* already stopped */ }
    });
    this.ambientNodes = [];
    this.ambientGain = null;
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

  private startAmbientLoop() {
    if (!this.ctx) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.isMuted ? 0 : 0.05;
    this.ambientGain.connect(this.ctx.destination);
    this.ambientNodes.push(this.ambientGain);

    // Diminished minor jazz chord: C2, Eb2, G2, Bb2
    const freqs = [65.41, 77.78, 98.0, 116.54];
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + Math.random() * 0.1;

      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 5;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(this.ambientGain!);

      osc.start();
      lfo.start();

      this.ambientNodes.push(osc, lfo, lfoGain);
    });
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
