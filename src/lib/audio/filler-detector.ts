// SpeakLife AI — Vietnamese & English Filler Word Detector Engine

import { VIETNAMESE_FILLER_WORDS, ENGLISH_FILLER_WORDS, FillerWordDefinition } from "../constants/fillers";

export interface DetectedFillerInstance {
  word: string;
  matchedText: string;
  timestampSeconds: number;
  category: "verbal_pause" | "crutch_word" | "hesitation";
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export interface FillerDetectionAnalysis {
  totalFillers: number;
  fillersPerMinute: number;
  uniqueWords: Record<string, number>;
  instances: DetectedFillerInstance[];
  annotatedHtml: string;
  cleanTranscript: string;
}

export function detectFillerWords(
  rawTranscript: string,
  durationSeconds: number = 60,
  language: "vi" | "en" = "vi"
): FillerDetectionAnalysis {
  const dictionary: FillerWordDefinition[] = language === "vi" 
    ? [...VIETNAMESE_FILLER_WORDS, ...ENGLISH_FILLER_WORDS]
    : [...ENGLISH_FILLER_WORDS, ...VIETNAMESE_FILLER_WORDS];

  const instances: DetectedFillerInstance[] = [];
  const uniqueWords: Record<string, number> = {};
  const durationMinutes = Math.max(0.1, durationSeconds / 60);

  // Split into tokens while tracking approximate word position / timestamps
  const words = rawTranscript.split(/\s+/).filter(Boolean);
  const timePerWord = durationSeconds / Math.max(1, words.length);

  let annotatedHtml = rawTranscript;

  dictionary.forEach((def) => {
    const regex = new RegExp(def.pattern.source, "giu");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(rawTranscript)) !== null) {
      const matchedWord = match[1] || match[0].trim();
      const matchIndex = match.index;
      // Estimate timestamp based on character offset ratio
      const timeOffset = Math.round((matchIndex / Math.max(1, rawTranscript.length)) * durationSeconds);

      instances.push({
        word: def.word,
        matchedText: matchedWord,
        timestampSeconds: timeOffset,
        category: def.category,
        severity: def.severity,
        suggestion: def.suggestion
      });

      uniqueWords[def.word] = (uniqueWords[def.word] || 0) + 1;
    }
  });

  // Sort instances chronologically
  instances.sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  // Generate safe annotated markup highlighting each filler word
  dictionary.forEach((def) => {
    const highlightRegex = new RegExp(`(?:^|\\s)(${def.word})(?:\\s|[.,!?]|$)`, "giu");
    annotatedHtml = annotatedHtml.replace(highlightRegex, (match, p1) => {
      return match.replace(
        p1,
        `<mark class="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-medium border border-amber-300" title="${def.suggestion}">${p1}</mark>`
      );
    });
  });

  // Generate clean transcript by stripping filler pauses
  let cleanTranscript = rawTranscript;
  dictionary.forEach((def) => {
    cleanTranscript = cleanTranscript.replace(new RegExp(`(?:^|\\s)(?:${def.word})(?=\\s|[.,!?]|$)`, "giu"), " ");
  });
  cleanTranscript = cleanTranscript.replace(/\s+/g, " ").trim();

  return {
    totalFillers: instances.length,
    fillersPerMinute: Math.round((instances.length / durationMinutes) * 10) / 10,
    uniqueWords,
    instances,
    annotatedHtml,
    cleanTranscript
  };
}
