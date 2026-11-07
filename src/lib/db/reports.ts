/**
 * SpeakLife AI — Report Repository
 * Database operations for diagnostic reports.
 */

import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { MPREEvaluationResult } from "@/lib/rubric/mpre-calculator";

export interface ReportRecord {
  id: string;
  session_id: string;
  user_id: string;
  total_score: number;
  tier: string;
  body_language_score: number;
  voice_prosody_score: number;
  filler_words_score: number;
  content_logic_score: number;
  rebuttal_reflex_score: number;
  metrics_json: string;
  dimensions_json: string;
  recommendations_json: string;
  eye_contact_ratio: number;
  wpm: number;
  filler_count: number;
  avg_reaction_seconds: number;
  created_at: string;
}

export function saveReport(
  sessionId: string,
  userId: string,
  evaluation: MPREEvaluationResult
): ReportRecord {
  const db = getDatabase();
  const id = `rpt_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

  db.prepare(`
    INSERT INTO reports (
      id, session_id, user_id, total_score, tier,
      body_language_score, voice_prosody_score, filler_words_score,
      content_logic_score, rebuttal_reflex_score,
      metrics_json, dimensions_json, recommendations_json,
      eye_contact_ratio, wpm, filler_count, avg_reaction_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, sessionId, userId, evaluation.totalScore, evaluation.tier,
    evaluation.dimensions.bodyLanguage.score,
    evaluation.dimensions.voiceProsody.score,
    evaluation.dimensions.fillerWords.score,
    evaluation.dimensions.contentLogic.score,
    evaluation.dimensions.rebuttalReflex.score,
    JSON.stringify(evaluation.metricsSummary),
    JSON.stringify(evaluation.dimensions),
    JSON.stringify(evaluation.keyRecommendations),
    evaluation.metricsSummary.eyeContactRatio,
    evaluation.metricsSummary.wpm,
    Math.round(evaluation.metricsSummary.fillerWordRatePerMinute),
    evaluation.metricsSummary.avgReactionSeconds
  );

  return getReportById(id)!;
}

export function getReportById(id: string): ReportRecord | null {
  const db = getDatabase();
  return db.prepare("SELECT * FROM reports WHERE id = ?").get(id) as ReportRecord | null;
}

export function getReportBySessionId(sessionId: string): ReportRecord | null {
  const db = getDatabase();
  return db.prepare("SELECT * FROM reports WHERE session_id = ?").get(sessionId) as ReportRecord | null;
}

export function getReportsByUser(userId: string, limit: number = 20): ReportRecord[] {
  const db = getDatabase();
  return db.prepare(
    "SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(userId, limit) as ReportRecord[];
}

export function getUserReportStats(userId: string): {
  totalReports: number;
  averageScore: number;
  bestScore: number;
  avgEyeContact: number;
  avgWpm: number;
} {
  const db = getDatabase();
  const stats = db.prepare(`
    SELECT
      count(*) as totalReports,
      COALESCE(round(avg(total_score), 1), 0) as averageScore,
      COALESCE(max(total_score), 0) as bestScore,
      COALESCE(round(avg(eye_contact_ratio), 0), 0) as avgEyeContact,
      COALESCE(round(avg(wpm), 0), 0) as avgWpm
    FROM reports WHERE user_id = ?
  `).get(userId) as any;

  return {
    totalReports: stats.totalReports || 0,
    averageScore: stats.averageScore || 0,
    bestScore: stats.bestScore || 0,
    avgEyeContact: stats.avgEyeContact || 0,
    avgWpm: stats.avgWpm || 0,
  };
}
