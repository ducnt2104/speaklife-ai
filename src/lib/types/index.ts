/**
 * SpeakLife AI — Core Interface Contracts
 * Architecture: Modular Monolith with Clean Layering
 * Source: PROJECT.md M1 Interface Contracts
 */

// =============================================================================
// 1. SCENARIO & DIFFICULTY TYPES
// =============================================================================

export type ScenarioType =
  | "khkt_defense"
  | "class_lecture"
  | "english_debate"
  | "admission_interview";

export type DifficultyLevel =
  | "gentle"
  | "balanced"
  | "rigorous"
  | "adversarial";

// =============================================================================
// 2. PRESENTATION CONTEXT
// =============================================================================

export interface PresentationContext {
  id: string;
  title: string;
  scenario: ScenarioType;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  outline?: string;
  // Extended / legacy compatibility fields
  userId?: string;
  topic?: string;
  outlineText?: string;
  slideCount?: number;
  createdAt?: string;
}

// =============================================================================
// 3. TELEMETRY & METRIC DATA POINTS
// =============================================================================

export interface MetricDataPoint {
  timestamp: number;
  eyeContactPercent: number;
  headStabilityPercent: number;
  shoulderTiltDegrees: number;
  volumeDb: number;
  pitchHz: number;
  wpm: number;
  // Optional telemetry aliases for backward compatibility
  timestampSec?: number;
  eyeContactScore?: number;
  headPitchDeg?: number;
  headYawDeg?: number;
  shoulderLevelRatio?: number;
  voiceVolumeDb?: number;
  voicePitchHz?: number;
  isSpeaking?: boolean;
  fillerWordDetected?: string;
}

// =============================================================================
// 4. FILLER WORDS & HESITATION OCCURRENCES
// =============================================================================

export interface FillerWordOccurrence {
  word: string;
  timestampSec: number;
  contextSnippet: string;
  timestamp?: number;
}

// =============================================================================
// 5. ADVERSARIAL AI JUDGE QUESTIONS
// =============================================================================

export interface JudgeQuestion {
  id: string;
  judgeName: string;
  judgeRole: string;
  questionText: string;
  targetedFlaw: string;
  timeLimitSec: number;
  judgeAvatar?: string;
  avatarColor?: string;
  userAnswerText?: string;
  userAnswerAudioDurationSec?: number;
  evaluationScore?: number;
  critiqueFeedback?: string;
}

// =============================================================================
// 6. RUBRIC AXIS SCORE & MPRE SCORING
// =============================================================================

export type RubricAxisStatus =
  | "measured"
  | "estimated"
  | "ai_evaluated"
  | "insufficient_data";

export interface RubricAxisScore {
  score?: number;
  maxScore: number;
  status?: RubricAxisStatus;
  feedback?: string[];
  // Extended / UI compatibility aliases
  name?: string;
  achievedScore?: number;
  measuredPercentage?: number;
  fidelityStatus?: "Measured" | "Estimated" | "Insufficient Data" | "AI Evaluated";
  benchmarkComparison?: string;
  feedbackSummary?: string;
}

// =============================================================================
// 7. DIAGNOSTIC REPORT DATA
// =============================================================================

export interface DiagnosticAxes {
  bodyLanguage: RubricAxisScore;
  voiceProsody: RubricAxisScore;
  fillerWords: RubricAxisScore;
  contentLogic: RubricAxisScore;
  qaReflex?: RubricAxisScore;
  criticalQA?: RubricAxisScore; // Backward-compatibility alias for qaReflex
}

export interface PersonalizedDrill {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
  targetWeakness: string;
}

export interface DiagnosticReportData {
  id?: string;
  sessionId: string;
  userId?: string;
  overallScore: number;
  rank?: string;
  axes: DiagnosticAxes;
  isInsufficientData?: boolean;
  createdAt?: string;
  // Extended / backward compatibility fields
  presentationTitle?: string;
  scenario?: ScenarioType;
  difficulty?: DifficultyLevel;
  durationSec?: number;
  dataCoverageRatio?: number;
  fillerOccurrences?: FillerWordOccurrence[];
  averageWpm?: number;
  eyeContactRatio?: number;
  judgeQuestions?: JudgeQuestion[];
  personalizedDrills?: PersonalizedDrill[];
  generatedAt?: string;
}

// =============================================================================
// 8. USER PRIVACY & ZERO-DATA RETENTION (ZDR) CONSENT
// =============================================================================

export interface UserPrivacyConsent {
  allowLocalCameraProcessing: boolean;
  allowLocalMicrophoneProcessing: boolean;
  allowTranscriptToGemini: boolean;
  allowAnonymousBenchmarkSharing: boolean;
  zeroDataRetentionAcknowledged: boolean;
}

// =============================================================================
// 9. RAW SESSION DATA (M3 ↔ M5 Rubric Calculator Input Contract)
// =============================================================================

export interface RebuttalRoundData {
  reactionTimeSeconds: number;
  score: number;
  questionId?: string;
}

export interface RawSessionData {
  sessionId: string;
  durationSeconds: number;
  totalWords: number;
  faceDetectedFrames: number;
  totalAnalyzedFrames: number;
  eyeContactFrames: number;
  shoulderTiltVariance: number;
  averageRmsDecibels: number;
  pitchF0StdDev: number;
  fillerWordCount: number;
  aiContentScore?: number;
  rebuttalRounds?: RebuttalRoundData[];
  metricDataPoints?: MetricDataPoint[];
  fillerOccurrences?: FillerWordOccurrence[];
  judgeQuestions?: JudgeQuestion[];
  presentationContext?: PresentationContext;
  userId?: string;
  createdAt?: string;
}
