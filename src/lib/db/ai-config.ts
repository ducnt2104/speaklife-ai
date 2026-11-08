/**
 * SpeakLife AI — AI Configuration Repository
 */

import { getDatabase } from "@/lib/db";

export interface AIConfigRecord {
  id: number;
  provider: string;
  model: string;
  is_enabled: number;
  max_requests_per_minute: number;
  api_key: string | null;
  last_tested_at: string | null;
  last_status: string;
  updated_at: string;
}

export function getAIConfig(): AIConfigRecord {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM ai_config WHERE id = 1").get() as AIConfigRecord | undefined;
  if (!row) {
    db.prepare("INSERT OR IGNORE INTO ai_config (id) VALUES (1)").run();
    return db.prepare("SELECT * FROM ai_config WHERE id = 1").get() as AIConfigRecord;
  }
  return row;
}

export function updateAIConfig(updates: {
  provider?: string;
  model?: string;
  apiKey?: string;
  isEnabled?: boolean;
  lastStatus?: string;
  lastTestedAt?: string;
}): AIConfigRecord {
  const db = getDatabase();
  const current = getAIConfig();

  const provider = updates.provider ?? current.provider;
  const model = updates.model ?? current.model;
  const apiKey = updates.apiKey !== undefined ? updates.apiKey : current.api_key;
  const isEnabled = updates.isEnabled !== undefined ? (updates.isEnabled ? 1 : 0) : current.is_enabled;
  const lastStatus = updates.lastStatus ?? current.last_status;
  const lastTestedAt = updates.lastTestedAt ?? current.last_tested_at;

  db.prepare(`
    UPDATE ai_config
    SET provider = ?, model = ?, api_key = ?, is_enabled = ?, last_status = ?, last_tested_at = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(provider, model, apiKey, isEnabled, lastStatus, lastTestedAt);

  return getAIConfig();
}

/**
 * Returns the effective API key: DB stored key takes precedence, fallback to environment variable.
 */
export function getEffectiveGeminiApiKey(): string | null {
  try {
    const config = getAIConfig();
    if (config.api_key && config.api_key.trim().length > 0) {
      return config.api_key.trim();
    }
  } catch (err) {
    // Fallback if table not ready yet
  }
  return process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
}
