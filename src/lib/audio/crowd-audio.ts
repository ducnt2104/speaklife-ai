// SpeakLife AI — Web Audio Procedural Crowd Acoustics Engine
// Pure procedural synthesis in Web Audio API:
// 1. Ambient Stadium Murmur
// 2. Realistic Multi-pulse Applause Clapping
// 3. Cheering Ovation Swell
// Zero audio assets required, 100% offline, zero network latency

export class CrowdAudioSynthesizer {
  private static instance: CrowdAudioSynthesizer | null = null;
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private murmurNode: { source: AudioNode; gain: GainNode } | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("speaklife_crowd_audio");
      if (saved !== null) {
        this.isEnabled = saved === "true";
      }
    }
  }

  public static getInstance(): CrowdAudioSynthesizer {
    if (!CrowdAudioSynthesizer.instance) {
      CrowdAudioSynthesizer.instance = new CrowdAudioSynthesizer();
    }
    return CrowdAudioSynthesizer.instance;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopMurmur();
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Create 1 second buffer of white noise
  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Play realistic applause clapping burst
  public playApplause(durationSeconds: number = 3.5) {
    if (!this.isEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSeconds);
    masterGain.connect(ctx.destination);

    // Generate ~35-40 individual hand-clap pulses per second spread over time
    const totalClaps = Math.floor(durationSeconds * 30);
    for (let i = 0; i < totalClaps; i++) {
      const startTime = ctx.currentTime + Math.random() * (durationSeconds - 0.4);
      const clapLength = 0.03 + Math.random() * 0.02;

      // Noise source
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * clapLength), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let s = 0; s < output.length; s++) {
        output[s] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Bandpass filter centered around 1000Hz - 2200Hz (human hand palm acoustics)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000 + Math.random() * 1200;
      filter.Q.value = 1.8 + Math.random() * 1.5;

      const clapGain = ctx.createGain();
      clapGain.gain.setValueAtTime(0.3 + Math.random() * 0.4, startTime);
      clapGain.gain.exponentialRampToValueAtTime(0.001, startTime + clapLength);

      noiseSource.connect(filter);
      filter.connect(clapGain);
      clapGain.connect(masterGain);

      noiseSource.start(startTime);
      noiseSource.stop(startTime + clapLength);
    }
  }

  // Start low ambient stadium murmur (continuous filtered noise)
  public startMurmur() {
    if (!this.isEnabled || this.murmurNode) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const noiseBuffer = this.createNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Bandpass filter for low human vocal chatter (200Hz - 600Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 350;
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.0);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.murmurNode = { source: noiseSource, gain };
    } catch (err) {
      console.warn("Failed to start stadium murmur:", err);
    }
  }

  public stopMurmur() {
    if (!this.murmurNode || !this.ctx) return;
    try {
      const { source, gain } = this.murmurNode;
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        try {
          (source as any).stop?.();
        } catch {}
      }, 500);
    } catch {}
    this.murmurNode = null;
  }
}
