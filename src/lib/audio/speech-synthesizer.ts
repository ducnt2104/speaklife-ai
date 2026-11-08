// SpeakLife AI — Text-to-Speech (TTS) Engine
// Uses Web Speech API (window.speechSynthesis)
// Dynamically finds natural Vietnamese or English voices

export class SpeechSynthesizer {
  private static instance: SpeechSynthesizer | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    this.loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  public static getInstance(): SpeechSynthesizer {
    if (!SpeechSynthesizer.instance) {
      SpeechSynthesizer.instance = new SpeechSynthesizer();
    }
    return SpeechSynthesizer.instance;
  }

  public static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private loadVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voices = window.speechSynthesis.getVoices();

    // Prefer Vietnamese voices (vi-VN)
    const viVoice = this.voices.find(
      (v) => v.lang.startsWith("vi") || v.name.toLowerCase().includes("vietnam")
    );

    if (viVoice) {
      this.selectedVoice = viVoice;
    } else {
      // Fallback to first available voice or Google standard
      this.selectedVoice = this.voices[0] || null;
    }
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    // Stop any existing speech
    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      } else {
        utterance.lang = "vi-VN";
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        options.onError?.(e);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn("TTS speak failed:", err);
      return false;
    }
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    return window.speechSynthesis.speaking;
  }
}
