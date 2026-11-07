/**
 * SpeakLife AI — User Settings Repository
 */

import { getDatabase } from "@/lib/db";

export interface UserSettings {
  user_id: string;
  theme: "light" | "dark" | "system";
  accent_color: string;
  font_size: "small" | "medium" | "large";
  language: "vi" | "en";
  reduced_motion: boolean;
  compact_mode: boolean;
  notifications_enabled: boolean;
  updated_at: string;
}

export function getUserSettings(userId: string): UserSettings {
  const db = getDatabase();
  let row = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
  
  if (!row) {
    // Create default settings
    db.prepare(`
      INSERT INTO user_settings (user_id) VALUES (?)
    `).run(userId);
    row = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
  }

  return {
    user_id: row.user_id,
    theme: row.theme,
    accent_color: row.accent_color,
    font_size: row.font_size,
    language: row.language,
    reduced_motion: !!row.reduced_motion,
    compact_mode: !!row.compact_mode,
    notifications_enabled: !!row.notifications_enabled,
    updated_at: row.updated_at,
  };
}

export function updateUserSettings(
  userId: string,
  updates: Partial<Omit<UserSettings, "user_id" | "updated_at">>
): UserSettings {
  const db = getDatabase();
  
  // Ensure settings row exists
  getUserSettings(userId);

  const allowedFields = [
    "theme", "accent_color", "font_size", "language",
    "reduced_motion", "compact_mode", "notifications_enabled"
  ];

  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(typeof value === "boolean" ? (value ? 1 : 0) : value);
    }
  }

  if (setClauses.length > 0) {
    setClauses.push("updated_at = datetime('now')");
    values.push(userId);
    db.prepare(
      `UPDATE user_settings SET ${setClauses.join(", ")} WHERE user_id = ?`
    ).run(...values);
  }

  return getUserSettings(userId);
}
