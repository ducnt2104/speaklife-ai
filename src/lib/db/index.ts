/**
 * SpeakLife AI — SQLite Database Connection & Schema Manager
 * Real persistent database with migrations, WAL mode, and proper cleanup.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;

function getDbPath(): string {
  const dbPath = process.env.DATABASE_PATH || "./data/speaklife.db";
  return path.resolve(process.cwd(), dbPath);
}

export function getDatabase(): Database.Database {
  if (_db) return _db;

  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.pragma("busy_timeout = 5000");

  // Run migrations
  runMigrations(_db);

  return _db;
}

function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r: any) => r.name)
  );

  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.name)) {
      db.exec(migration.sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(migration.name);
      console.log(`[DB Migration] Applied: ${migration.name}`);
    }
  }
}

const MIGRATIONS = [
  {
    name: "001_create_users",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'admin')),
        settings_json TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `,
  },
  {
    name: "002_create_sessions",
    sql: `
      CREATE TABLE IF NOT EXISTS rehearsal_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        scenario TEXT NOT NULL DEFAULT 'khkt_defense',
        difficulty TEXT NOT NULL DEFAULT 'balanced',
        outline_text TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
        duration_seconds INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON rehearsal_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_created ON rehearsal_sessions(created_at DESC);
    `,
  },
  {
    name: "003_create_reports",
    sql: `
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_score INTEGER NOT NULL,
        tier TEXT NOT NULL,
        body_language_score INTEGER NOT NULL DEFAULT 0,
        voice_prosody_score INTEGER NOT NULL DEFAULT 0,
        filler_words_score INTEGER NOT NULL DEFAULT 0,
        content_logic_score INTEGER NOT NULL DEFAULT 0,
        rebuttal_reflex_score INTEGER NOT NULL DEFAULT 0,
        metrics_json TEXT NOT NULL DEFAULT '{}',
        dimensions_json TEXT NOT NULL DEFAULT '{}',
        recommendations_json TEXT NOT NULL DEFAULT '[]',
        eye_contact_ratio REAL DEFAULT 0,
        wpm INTEGER DEFAULT 0,
        filler_count INTEGER DEFAULT 0,
        avg_reaction_seconds REAL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES rehearsal_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
    `,
  },
  {
    name: "004_create_ai_config",
    sql: `
      CREATE TABLE IF NOT EXISTS ai_config (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        provider TEXT NOT NULL DEFAULT 'gemini',
        model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
        is_enabled INTEGER NOT NULL DEFAULT 1,
        max_requests_per_minute INTEGER NOT NULL DEFAULT 25,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO ai_config (id) VALUES (1);
    `,
  },
  {
    name: "005_create_user_settings",
    sql: `
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('light', 'dark', 'system')),
        accent_color TEXT NOT NULL DEFAULT 'violet',
        font_size TEXT NOT NULL DEFAULT 'medium' CHECK(font_size IN ('small', 'medium', 'large')),
        language TEXT NOT NULL DEFAULT 'vi' CHECK(language IN ('vi', 'en')),
        reduced_motion INTEGER NOT NULL DEFAULT 0,
        compact_mode INTEGER NOT NULL DEFAULT 0,
        notifications_enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
  },
];

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// Check database health
export function checkDatabaseHealth(): { connected: boolean; path: string; tables: number } {
  try {
    const db = getDatabase();
    const tables = db.prepare(
      "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations'"
    ).get() as { count: number };
    return { connected: true, path: getDbPath(), tables: tables.count };
  } catch (err) {
    return { connected: false, path: getDbPath(), tables: 0 };
  }
}
