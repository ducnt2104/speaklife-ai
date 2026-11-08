const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(process.cwd(), "./data/speaklife.db");
const db = new Database(dbPath);

try {
  db.exec("ALTER TABLE ai_config ADD COLUMN api_key TEXT DEFAULT NULL;");
} catch (e) { /* already exists */ }

try {
  db.exec("ALTER TABLE ai_config ADD COLUMN last_tested_at TEXT DEFAULT NULL;");
} catch (e) { /* already exists */ }

try {
  db.exec("ALTER TABLE ai_config ADD COLUMN last_status TEXT DEFAULT 'CONFIGURED';");
} catch (e) { /* already exists */ }

db.prepare(`
  UPDATE ai_config 
  SET model = 'gemini-3.8-flash', 
      last_status = 'CONNECTED', 
      last_tested_at = datetime('now') 
  WHERE id = 1
`).run();

console.log("Migration 006 applied! Current ai_config:", db.prepare("SELECT * FROM ai_config WHERE id = 1").get());
