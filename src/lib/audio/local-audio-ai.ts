/**
 * Local Audio AI — Client-Side Audio Feature Extraction
 * Uses Meyda for audio feature analysis (RMS, spectral centroid, ZCR, loudness).
 * Runs 100% in the browser via Web Audio API — zero network latency.
 */

// Lazy-loaded Meyda to avoid SSR issues
let MeydaModule: typeof import("meyda") | null = null;

export interface AudioAIMetrics {
  /** RMS energy in decibels */
  rmsDb: number;
  /** Spectral centroid — higher = brighter/sharper voice */
  spectralCentroid: number;
  /** Zero crossing rate — correlates with voice vs noise */
  zcr: number;
  /** Loudness (perceptual) */
  loudness: number;
  /** Pitch variance (std dev of spectral centroid samples) — monotone vs expressive */
  pitchVariance: number;
  /** Silence ratio (percentage of frames below threshold) */
  silenceRatio: number;
  /** Total analyzed frames */
  totalFrames: number;
  /** Number of silent frames */
  silentFrames: number;
}

const SILENCE_THRESHOLD_DB = -45;
const BUFFER_SIZE = 512;

export class LocalAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private meydaAnalyzer: any = null;
  private isRunning = false;

  // Metrics accumulators
  private totalFrames = 0;
  private silentFrames = 0;
  private spectralCentroidSamples: number[] = [];
  private latestRmsDb = -60;
  private latestSpectralCentroid = 0;
  private latestZcr = 0;
  private latestLoudness = 0;

  /**
   * Start analyzing audio from an existing MediaStream.
   * @param stream - The MediaStream from getUserMedia({ audio: true })
   */
  async start(stream: MediaStream): Promise<void> {
    if (this.isRunning) return;

    // Lazy-load Meyda
    if (!MeydaModule) {
      MeydaModule = await import("meyda");
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.audioContext = new AudioCtx();
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // Also create an AnalyserNode for raw dB fallback
    this.analyzerNode = this.audioContext.createAnalyser();
    this.analyzerNode.fftSize = 256;
    this.sourceNode.connect(this.analyzerNode);

    // Create Meyda analyzer
    const createMeydaAnalyzer =
      (MeydaModule as any).default?.createMeydaAnalyzer ||
      (MeydaModule as any).createMeydaAnalyzer;

    if (createMeydaAnalyzer) {
      this.meydaAnalyzer = createMeydaAnalyzer({
        audioContext: this.audioContext,
        source: this.sourceNode,
        bufferSize: BUFFER_SIZE,
        featureExtractors: ["rms", "spectralCentroid", "zcr", "loudness"],
        callback: (features: any) => {
          this.totalFrames++;

          // RMS → dB
          const rms = features.rms || 0;
          this.latestRmsDb = rms > 0 ? 20 * Math.log10(rms) : -60;

          // Track silence
          if (this.latestRmsDb < SILENCE_THRESHOLD_DB) {
            this.silentFrames++;
          }

          // Spectral centroid (pitch-like indicator)
          this.latestSpectralCentroid = features.spectralCentroid || 0;
          if (this.latestSpectralCentroid > 0) {
            this.spectralCentroidSamples.push(this.latestSpectralCentroid);
            // Keep last 500 samples to avoid memory bloat
            if (this.spectralCentroidSamples.length > 500) {
              this.spectralCentroidSamples.shift();
            }
          }

          // ZCR
          this.latestZcr = features.zcr || 0;

          // Loudness
          const loudnessObj = features.loudness;
          this.latestLoudness =
            typeof loudnessObj === "object" && loudnessObj?.total != null
              ? loudnessObj.total
              : typeof loudnessObj === "number"
              ? loudnessObj
              : 0;
        },
      });

      this.meydaAnalyzer.start();
    }

    this.isRunning = true;
  }

  /** Stop the analyzer and release resources */
  stop(): void {
    this.isRunning = false;

    if (this.meydaAnalyzer) {
      try {
        this.meydaAnalyzer.stop();
      } catch {
        // Meyda may throw if already stopped
      }
      this.meydaAnalyzer = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyzerNode = null;
  }

  /** Get current aggregated metrics */
  getMetrics(): AudioAIMetrics {
    // Calculate pitch variance (std dev of spectral centroid samples)
    let pitchVariance = 0;
    if (this.spectralCentroidSamples.length > 2) {
      const mean =
        this.spectralCentroidSamples.reduce((a, b) => a + b, 0) /
        this.spectralCentroidSamples.length;
      const squaredDiffs = this.spectralCentroidSamples.map((v) => (v - mean) ** 2);
      pitchVariance = Math.sqrt(
        squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length
      );
    }

    const silenceRatio =
      this.totalFrames > 0
        ? Math.round((this.silentFrames / this.totalFrames) * 100)
        : 0;

    return {
      rmsDb: Math.round(this.latestRmsDb),
      spectralCentroid: Math.round(this.latestSpectralCentroid * 100) / 100,
      zcr: Math.round(this.latestZcr * 100) / 100,
      loudness: Math.round(this.latestLoudness * 100) / 100,
      pitchVariance: Math.round(pitchVariance * 100) / 100,
      silenceRatio,
      totalFrames: this.totalFrames,
      silentFrames: this.silentFrames,
    };
  }

  /** Reset accumulated metrics (e.g., at start of new practice session) */
  reset(): void {
    this.totalFrames = 0;
    this.silentFrames = 0;
    this.spectralCentroidSamples = [];
    this.latestRmsDb = -60;
    this.latestSpectralCentroid = 0;
    this.latestZcr = 0;
    this.latestLoudness = 0;
  }
}
