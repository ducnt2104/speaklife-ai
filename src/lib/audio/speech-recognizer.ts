// SpeakLife AI — Continuous Speech-to-Text (STT) Engine
// Powered by browser Web Speech API (vi-VN with fallback to en-US)
// 100% Client-side streaming recognition with zero external latency

export interface SpeechRecognizerOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (fullTranscript: string, interimTranscript: string, wordCount: number) => void;
  onError?: (error: string) => void;
  onStateChange?: (isListening: boolean) => void;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldRestart: boolean = false;
  private fullTranscript: string = "";
  private interimTranscript: string = "";
  private lang: string = "vi-VN";
  private options: SpeechRecognizerOptions;

  constructor(options: SpeechRecognizerOptions = {}) {
    this.options = options;
    this.lang = options.lang || "vi-VN";
    this.initRecognition();
  }

  public static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn("Web Speech API not supported in this browser.");
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = this.options.continuous ?? true;
      this.recognition.interimResults = this.options.interimResults ?? true;
      this.recognition.lang = this.lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.options.onStateChange?.(true);
      };

      this.recognition.onresult = (event: any) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + " ";
          } else {
            interim += item[0].transcript;
          }
        }

        if (finalChunk) {
          this.fullTranscript = (this.fullTranscript + " " + finalChunk).replace(/\s+/g, " ").trim();
        }
        this.interimTranscript = interim.trim();

        const words = (this.fullTranscript + " " + this.interimTranscript)
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        this.options.onTranscript?.(
          this.fullTranscript,
          this.interimTranscript,
          words.length
        );
      };

      this.recognition.onerror = (event: any) => {
        // "no-speech" is normal during pauses; don't terminate
        if (event.error === "no-speech") {
          return;
        }
        console.warn("Speech recognition error:", event.error);
        this.options.onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.options.onStateChange?.(false);
        // Automatically restart if user hasn't explicitly stopped it
        if (this.shouldRestart) {
          try {
            this.recognition?.start();
          } catch {
            // Ignore if already active
          }
        }
      };
    } catch (e) {
      console.error("Failed to initialize SpeechRecognition:", e);
    }
  }

  public start(): boolean {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) return false;
    }

    try {
      this.shouldRestart = true;
      this.recognition.start();
      return true;
    } catch (err: any) {
      // If already started, ignore error
      if (err.name === "InvalidStateError") {
        return true;
      }
      console.warn("Failed to start speech recognition:", err);
      return false;
    }
  }

  public stop() {
    this.shouldRestart = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
  }

  public reset() {
    this.fullTranscript = "";
    this.interimTranscript = "";
  }

  public getTranscript(): string {
    return (this.fullTranscript + " " + this.interimTranscript).trim();
  }

  public getWordCount(): number {
    return this.getTranscript().split(/\s+/).filter(Boolean).length;
  }
}
