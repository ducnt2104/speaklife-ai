/**
 * SpeakLife AI — Rehearsal Session Repository
 * Database operations for practice sessions.
 */

import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface RehearsalSession {
  id: string;
  user_id: string;
  title: string;
  scenario: string;
  difficulty: string;
  outline_text: string;
  status: string;
  duration_seconds: number;
  created_at: string;
  completed_at: string | null;
}

export interface CreateSessionInput {
  userId: string;
  title: string;
  scenario: string;
  difficulty: string;
  outlineText: string;
}

export function createSession(input: CreateSessionInput): RehearsalSession {
  const db = getDatabase();
  const id = `ses_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

  db.prepare(`
    INSERT INTO rehearsal_sessions (id, user_id, title, scenario, difficulty, outline_text, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(id, input.userId, input.title, input.scenario, input.difficulty, input.outlineText);

  return getSessionById(id)!;
}

export function getSessionById(id: string): RehearsalSession | null {
  const db = getDatabase();
  return db.prepare("SELECT * FROM rehearsal_sessions WHERE id = ?").get(id) as RehearsalSession | null;
}

export function getSessionsByUser(userId: string, limit: number = 20, offset: number = 0): RehearsalSession[] {
  const db = getDatabase();
  return db.prepare(
    "SELECT * FROM rehearsal_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).all(userId, limit, offset) as RehearsalSession[];
}

export function completeSession(id: string, userId: string, durationSeconds: number): boolean {
  const db = getDatabase();
  const result = db.prepare(
    "UPDATE rehearsal_sessions SET status = 'completed', duration_seconds = ?, completed_at = datetime('now') WHERE id = ? AND user_id = ?"
  ).run(durationSeconds, id, userId);
  return result.changes > 0;
}

export function getUserSessionCount(userId: string): number {
  const db = getDatabase();
  const row = db.prepare("SELECT count(*) as count FROM rehearsal_sessions WHERE user_id = ?").get(userId) as { count: number };
  return row.count;
}

export function getUserSessionStats(userId: string): {
  totalSessions: number;
  completedSessions: number;
  totalPracticeMinutes: number;
} {
  const db = getDatabase();
  const stats = db.prepare(`
    SELECT 
      count(*) as totalSessions,
      count(CASE WHEN status = 'completed' THEN 1 END) as completedSessions,
      COALESCE(sum(duration_seconds), 0) / 60 as totalPracticeMinutes
    FROM rehearsal_sessions WHERE user_id = ?
  `).get(userId) as any;
  
  return {
    totalSessions: stats.totalSessions || 0,
    completedSessions: stats.completedSessions || 0,
    totalPracticeMinutes: Math.round(stats.totalPracticeMinutes || 0),
  };
}
