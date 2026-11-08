/**
 * SpeakLife AI — Vocal Loudness & Dynamics Engine
 * Client-side real-time loudness analysis with dBFS calibration,
 * dynamic range measurement, and zone classification.
 *
 * Integrates with CameraHUD's existing AudioContext pipeline.
 */

export interface LoudnessZone {
  label: string;
  color: string;
  icon: string;
}

export interface LoudnessMetrics {
  /** Current RMS level in dBFS */
  currentDbfs: number;
  /** Peak level in dBFS */
  peakDbfs: number;
  /** Average dBFS over the session */
  averageDbfs: number;
  /** Dynamic range (max - min of rolling window) in dB */
  dynamicRange: number;
  /** Standard deviation of dBFS — measures expressiveness */
  dynamicContrast: number;
  /** Current zone classification */
  zone: "optimal" | "too_quiet" | "too_loud" | "silent";
  /** Zone display info */
  zoneInfo: LoudnessZone;
  /** Loudness score 0-10 for Gemini report */
  loudnessScore: number;
  /** Human-readable feedback string */
  loudnessFeedback: string;
  /** Total samples collected */
  sampleCount: number;
  /** Percentage of time in optimal zone */
  optimalZonePercent: number;
  /** Percentage of time too quiet */
  tooQuietPercent: number;
  /** Percentage of time too loud */
  tooLoudPercent: number;
}

// Loudness zone thresholds (dBFS)
const THRESHOLDS = {
  SILENT: -55,        // Below this = no speech
  TOO_QUIET: -26,     // < -26 dBFS = too quiet
  OPTIMAL_LOW: -18,   // -18 to -12 = optimal
  OPTIMAL_HIGH: -12,
  TOO_LOUD: -6,       // > -6 dBFS = clipping/too loud
} as const;

const ZONE_INFO: Record<string, LoudnessZone> = {
  optimal: { label: "Tối ưu", color: "emerald", icon: "✓" },
  too_quiet: { label: "Quá nhỏ", color: "amber", icon: "↓" },
  too_loud: { label: "Quá to", color: "rose", icon: "↑" },
  silent: { label: "Im lặng", color: "slate", icon: "—" },
};

export class LoudnessDynamicsEngine {
  private samples: number[] = [];
  private rollingWindow: number[] = [];
  private maxWindowSize = 300; // ~5 minutes at 1 sample/sec
  private zoneCounters = { optimal: 0, too_quiet: 0, too_loud: 0, silent: 0 };
  private peakDbfs = -60;

  /** Record a new dBFS sample (call once per second or per analysis frame) */
  record(dbfs: number): void {
    // Clamp to reasonable range
    const clamped = Math.max(-60, Math.min(0, dbfs));
    this.samples.push(clamped);
    this.rollingWindow.push(clamped);

    if (this.rollingWindow.length > this.maxWindowSize) {
      this.rollingWindow.shift();
    }

    // Track peak
    if (clamped > this.peakDbfs) {
      this.peakDbfs = clamped;
    }

    // Track zone time
    const zone = this.classifyZone(clamped);
    this.zoneCounters[zone]++;
  }

  /** Classify a dBFS value into a zone */
  private classifyZone(dbfs: number): "optimal" | "too_quiet" | "too_loud" | "silent" {
    if (dbfs <= THRESHOLDS.SILENT) return "silent";
    if (dbfs < THRESHOLDS.TOO_QUIET) return "too_quiet";
    if (dbfs >= THRESHOLDS.OPTIMAL_LOW && dbfs <= THRESHOLDS.OPTIMAL_HIGH) return "optimal";
    if (dbfs > THRESHOLDS.TOO_LOUD) return "too_loud";
    // Between -26 and -18 or -12 and -6 — borderline, classify as closest
    if (dbfs < THRESHOLDS.OPTIMAL_LOW) return "too_quiet";
    return "too_loud";
  }

  /** Get comprehensive loudness metrics */
  getMetrics(): LoudnessMetrics {
    const n = this.samples.length;
    if (n === 0) {
      return {
        currentDbfs: -60,
        peakDbfs: -60,
        averageDbfs: -60,
        dynamicRange: 0,
        dynamicContrast: 0,
        zone: "silent",
        zoneInfo: ZONE_INFO.silent,
        loudnessScore: 0,
        loudnessFeedback: "Chưa có dữ liệu âm thanh.",
        sampleCount: 0,
        optimalZonePercent: 0,
        tooQuietPercent: 0,
        tooLoudPercent: 0,
      };
    }

    const current = this.samples[n - 1];
    const zone = this.classifyZone(current);

    // Average dBFS (exclude silent frames for meaningful average)
    const speechSamples = this.samples.filter(s => s > THRESHOLDS.SILENT);
    const avg = speechSamples.length > 0
      ? speechSamples.reduce((a, b) => a + b, 0) / speechSamples.length
      : -60;

    // Dynamic range from rolling window
    const windowSpeech = this.rollingWindow.filter(s => s > THRESHOLDS.SILENT);
    let dynamicRange = 0;
    if (windowSpeech.length > 2) {
      const wMin = Math.min(...windowSpeech);
      const wMax = Math.max(...windowSpeech);
      dynamicRange = Math.round(wMax - wMin);
    }

    // Dynamic contrast (std dev) — measures expressiveness
    let dynamicContrast = 0;
    if (speechSamples.length > 2) {
      const mean = speechSamples.reduce((a, b) => a + b, 0) / speechSamples.length;
      const variance = speechSamples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / speechSamples.length;
      dynamicContrast = Math.round(Math.sqrt(variance) * 10) / 10;
    }

    // Zone percentages
    const totalZoned = this.zoneCounters.optimal + this.zoneCounters.too_quiet +
      this.zoneCounters.too_loud + this.zoneCounters.silent;
    const optimalZonePercent = totalZoned > 0 ? Math.round((this.zoneCounters.optimal / totalZoned) * 100) : 0;
    const tooQuietPercent = totalZoned > 0 ? Math.round((this.zoneCounters.too_quiet / totalZoned) * 100) : 0;
    const tooLoudPercent = totalZoned > 0 ? Math.round((this.zoneCounters.too_loud / totalZoned) * 100) : 0;

    // Loudness Score (0-10)
    const loudnessScore = this.calculateScore(avg, dynamicContrast, optimalZonePercent);
    const loudnessFeedback = this.generateFeedback(avg, dynamicContrast, optimalZonePercent, tooQuietPercent, tooLoudPercent);

    return {
      currentDbfs: Math.round(current),
      peakDbfs: Math.round(this.peakDbfs),
      averageDbfs: Math.round(avg),
      dynamicRange,
      dynamicContrast,
      zone,
      zoneInfo: ZONE_INFO[zone],
      loudnessScore,
      loudnessFeedback,
      sampleCount: n,
      optimalZonePercent,
      tooQuietPercent,
      tooLoudPercent,
    };
  }

  private calculateScore(avgDb: number, contrast: number, optimalPercent: number): number {
    let score = 5; // Base

    // Average dBFS scoring (max 4 pts)
    if (avgDb >= THRESHOLDS.OPTIMAL_LOW && avgDb <= THRESHOLDS.OPTIMAL_HIGH) {
      score += 4;
    } else if (avgDb >= -22 && avgDb <= -10) {
      score += 2.5;
    } else if (avgDb >= -28 && avgDb <= -8) {
      score += 1;
    }

    // Dynamic contrast scoring (max 3 pts) — not monotone
    if (contrast >= 3 && contrast <= 8) {
      score += 3; // Good vocal variety
    } else if (contrast >= 2 && contrast <= 12) {
      score += 1.5;
    } else if (contrast < 2) {
      score -= 1; // Too monotone
    }

    // Optimal zone percentage bonus (max 3 pts)
    if (optimalPercent >= 70) score += 3;
    else if (optimalPercent >= 50) score += 2;
    else if (optimalPercent >= 30) score += 1;

    return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
  }

  private generateFeedback(
    avgDb: number, contrast: number,
    optimalPercent: number, quietPercent: number, loudPercent: number
  ): string {
    const parts: string[] = [];

    // Average volume feedback
    if (avgDb >= THRESHOLDS.OPTIMAL_LOW && avgDb <= THRESHOLDS.OPTIMAL_HIGH) {
      parts.push(`Âm lượng trung bình đạt chuẩn tối ưu (${Math.round(avgDb)} dBFS).`);
    } else if (avgDb < THRESHOLDS.TOO_QUIET) {
      parts.push(`Âm lượng trung bình quá nhỏ (${Math.round(avgDb)} dBFS). Hãy nói to hơn và rõ ràng hơn.`);
    } else if (avgDb > THRESHOLDS.TOO_LOUD) {
      parts.push(`Âm lượng trung bình quá to (${Math.round(avgDb)} dBFS), có nguy cơ méo tiếng/chói tai.`);
    } else {
      parts.push(`Âm lượng trung bình ở mức chấp nhận được (${Math.round(avgDb)} dBFS).`);
    }

    // Dynamic contrast feedback
    if (contrast < 2) {
      parts.push("Giọng nói thiếu điểm nhấn, gần như đơn điệu (monotone). Hãy tập nhấn nhá 3 cường độ khác nhau.");
    } else if (contrast >= 3 && contrast <= 8) {
      parts.push("Độ biến thiên âm lượng tốt, cho thấy bạn có sử dụng điểm nhấn và khoảng lặng hiệu quả.");
    } else if (contrast > 12) {
      parts.push("Âm lượng dao động quá mạnh, cần kiểm soát ổn định hơn giữa các phần.");
    }

    // Zone distribution
    if (quietPercent > 30) {
      parts.push(`${quietPercent}% thời gian bạn nói quá nhỏ. Hãy duy trì giọng rõ ràng đặc biệt ở phần Mở bài.`);
    }
    if (loudPercent > 20) {
      parts.push(`${loudPercent}% thời gian micro nhận âm quá to. Hãy giữ khoảng cách 15-20cm với mic.`);
    }

    return parts.join(" ");
  }

  /** Reset all data for a new session */
  reset(): void {
    this.samples = [];
    this.rollingWindow = [];
    this.peakDbfs = -60;
    this.zoneCounters = { optimal: 0, too_quiet: 0, too_loud: 0, silent: 0 };
  }
}
