const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "dmagic.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trigger_keywords TEXT NOT NULL,
    dm_message TEXT NOT NULL,
    reply_comment TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    total_triggered INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL,
    automation_name TEXT NOT NULL,
    instagram_user_id TEXT NOT NULL,
    instagram_username TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    matched_keyword TEXT NOT NULL,
    dm_sent INTEGER DEFAULT 0,
    comment_replied INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_activity_automation ON activity_log(automation_id);
`);

console.log("Database initialized successfully at:", DB_PATH);
db.close();
