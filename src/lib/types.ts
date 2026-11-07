export type ScenarioType = 
  | "khkt_defense" 
  | "class_lecture" 
  | "english_debate" 
  | "admission_interview";

export type DifficultyLevel = "gentle" | "balanced" | "rigorous" | "adversarial";

export interface PresentationContext {
  id: string;
  userId: string;
  title: string;
  scenario: ScenarioType;
  difficulty: DifficultyLevel;
  topic: string;
  outlineText: string;
  slideCount?: number;
  durationMinutes: number;
  createdAt: string;
}

export interface MetricDataPoint {
  timestampSec: number;
  eyeContactScore: number; // 0 to 1
  headPitchDeg: number;
  headYawDeg: number;
  shoulderLevelRatio: number;
  voiceVolumeDb: number;
  voicePitchHz: number;
  isSpeaking: boolean;
  fillerWordDetected?: string;
}

export interface FillerWordOccurrence {
  word: string;
  timestampSec: number;
  contextSnippet: string;
}

export interface JudgeQuestion {
  id: string;
  judgeName: string;
  judgeRole: string;
  judgeAvatar?: string;
  avatarColor?: string;
  questionText: string;
  targetedFlaw: string;
  timeLimitSec: number;
  userAnswerText?: string;
  userAnswerAudioDurationSec?: number;
  evaluationScore?: number;
  critiqueFeedback?: string;
}

export interface RubricAxisScore {
  name: string;
  maxScore: number;
  achievedScore: number;
  measuredPercentage: number;
  fidelityStatus: "Measured" | "Estimated" | "Insufficient Data";
  benchmarkComparison: string;
  feedbackSummary: string;
}

export interface DiagnosticReportData {
  sessionId: string;
  presentationTitle: string;
  scenario: ScenarioType;
  difficulty: DifficultyLevel;
  durationSec: number;
  overallScore: number; // /100
  dataCoverageRatio: number; // 0 to 1
  axes: {
    bodyLanguage: RubricAxisScore; // max 25
    voiceProsody: RubricAxisScore;  // max 20
    fillerWords: RubricAxisScore;   // max 15
    contentLogic: RubricAxisScore;  // max 20
    criticalQA: RubricAxisScore;    // max 20
  };
  fillerOccurrences: FillerWordOccurrence[];
  averageWpm: number;
  eyeContactRatio: number;
  judgeQuestions: JudgeQuestion[];
  personalizedDrills: {
    id: string;
    title: string;
    durationMinutes: number;
    description: string;
    targetWeakness: string;
  }[];
  generatedAt: string;
}

export interface UserPrivacyConsent {
  allowLocalCameraProcessing: boolean;
  allowLocalMicrophoneProcessing: boolean;
  allowTranscriptToGemini: boolean;
  allowAnonymousBenchmarkSharing: boolean;
  zeroDataRetentionAcknowledged: boolean;
}
