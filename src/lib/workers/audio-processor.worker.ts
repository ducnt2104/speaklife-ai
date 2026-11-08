/**
 * SpeakLife AI — Audio Processing Web Worker
 * Offloads RMS dB computation, silence detection, and filler word
 * regex matching from the Main Thread to a dedicated Worker thread.
 * 
 * Messages IN:
 *   { type: "PROCESS_AUDIO", pcmData: number[], sampleRate: number }
 *   { type: "DETECT_FILLERS", text: string, elapsedSec: number }
 * 
 * Messages OUT:
 *   { type: "AUDIO_METRICS", rmsDb: number, isSilent: boolean, peak: number }
 *   { type: "FILLER_RESULT", fillers: Array<{ word, timestampSec, contextSnippet }> }
 */

// Vietnamese filler word patterns (duplicated from constants for Worker isolation)
const FILLER_PATTERNS: Array<{ pattern: RegExp; word: string }> = [
  { pattern: /\b(ừm+|uhm+|um+)\b/gi, word: "ừm" },
  { pattern: /\b(à+|ah+)\b/gi, word: "à" },
  { pattern: /\b(ờ+)\b/gi, word: "ờ" },
  { pattern: /\b(uh+)\b/gi, word: "uh" },
  { pattern: /\bthì\s+là\b/gi, word: "thì là" },
  { pattern: /\bkiểu\s+như\b/gi, word: "kiểu như" },
  { pattern: /\bkiểu\b/gi, word: "kiểu" },
  { pattern: /\bnói\s+chung\s+là\b/gi, word: "nói chung là" },
  { pattern: /\bcơ\s+bản\s+là\b/gi, word: "cơ bản là" },
  { pattern: /\bthực\s+ra\s+là\b/gi, word: "thực ra là" },
  { pattern: /\btức\s+là\b/gi, word: "tức là" },
  { pattern: /\bnhư\s+là\b/gi, word: "như là" },
  { pattern: /\bcái\s+này\b/gi, word: "cái này" },
  { pattern: /\bthật\s+ra\b/gi, word: "thật ra" },
];

const SILENCE_THRESHOLD_DB = -45;

self.onmessage = function (e: MessageEvent) {
  const { type } = e.data;

  if (type === "PROCESS_AUDIO") {
    const { pcmData, sampleRate } = e.data;
    const len = pcmData.length;

    if (len === 0) {
      self.postMessage({ type: "AUDIO_METRICS", rmsDb: -60, isSilent: true, peak: 0 });
      return;
    }

    // Compute RMS
    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const val = pcmData[i]; // 0-255 range from getByteFrequencyData
      const normalized = val / 255;
      sumSquares += normalized * normalized;
      if (normalized > peak) peak = normalized;
    }
    const rms = Math.sqrt(sumSquares / len);
    const rmsDb = rms > 0 ? Math.round(20 * Math.log10(rms)) : -60;
    const peakDb = peak > 0 ? Math.round(20 * Math.log10(peak)) : -60;
    const isSilent = rmsDb < SILENCE_THRESHOLD_DB;

    self.postMessage({
      type: "AUDIO_METRICS",
      rmsDb,
      peakDb,
      isSilent,
      peak: Math.round(peak * 100),
    });
  }

  if (type === "DETECT_FILLERS") {
    const { text, elapsedSec } = e.data;
    const fillers: Array<{ word: string; timestampSec: number; contextSnippet: string }> = [];

    for (const fp of FILLER_PATTERNS) {
      let match: RegExpExecArray | null;
      // Reset regex state
      fp.pattern.lastIndex = 0;
      while ((match = fp.pattern.exec(text)) !== null) {
        const idx = match.index;
        const contextStart = Math.max(0, idx - 20);
        const contextEnd = Math.min(text.length, idx + match[0].length + 20);
        fillers.push({
          word: fp.word,
          timestampSec: Math.round(elapsedSec),
          contextSnippet: text.slice(contextStart, contextEnd).trim(),
        });
      }
    }

    self.postMessage({ type: "FILLER_RESULT", fillers });
  }
};
