import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../data/studysesh.db')

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name   TEXT    NOT NULL,
    date        TEXT    NOT NULL,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER NOT NULL,
    focus_secs  INTEGER NOT NULL DEFAULT 0,
    idle_secs   INTEGER NOT NULL DEFAULT 0,
    pomodoros   INTEGER NOT NULL DEFAULT 0,
    tasks_done  INTEGER NOT NULL DEFAULT 0,
    notes       TEXT,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_date      ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_name, date);

  CREATE TABLE IF NOT EXISTS goals (
    user_name         TEXT    PRIMARY KEY,
    daily_focus_mins  INTEGER NOT NULL DEFAULT 120,
    updated_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    login_name    TEXT NOT NULL UNIQUE,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_base64 TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_users_login ON users(login_name);

  CREATE TABLE IF NOT EXISTS tasks (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    description          TEXT,
    column_id            TEXT NOT NULL DEFAULT 'not-started',
    priority             TEXT NOT NULL DEFAULT 'medium',
    subject_id           TEXT,
    subtasks_json        TEXT NOT NULL DEFAULT '[]',
    estimated_pomodoros  INTEGER,
    actual_pomodoros     INTEGER NOT NULL DEFAULT 0,
    created_at           INTEGER NOT NULL,
    completed_at         INTEGER,
    sort_order           INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user     ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_user_col ON tasks(user_id, column_id);

  CREATE TABLE IF NOT EXISTS subjects (
    id       TEXT PRIMARY KEY,
    user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name     TEXT NOT NULL,
    color    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    text       TEXT NOT NULL UNIQUE,
    added_by   TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS color_presets (
    id         TEXT    PRIMARY KEY,
    name       TEXT    NOT NULL,
    vars_json  TEXT    NOT NULL,
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
`)

// Budget tables
db.exec(`
  CREATE TABLE IF NOT EXISTS budget_categories (
    id       TEXT PRIMARY KEY,
    user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name     TEXT NOT NULL,
    color    TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_budget_categories_user ON budget_categories(user_id);

  CREATE TABLE IF NOT EXISTS budget_transactions (
    id           TEXT    PRIMARY KEY,
    user_id      TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date         TEXT    NOT NULL,
    name         TEXT    NOT NULL,
    amount       REAL    NOT NULL,
    category_id  TEXT    REFERENCES budget_categories(id) ON DELETE SET NULL,
    notes        TEXT,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_budget_tx_user      ON budget_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_budget_tx_user_date ON budget_transactions(user_id, date);

  CREATE TABLE IF NOT EXISTS budget_settings (
    user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    weekly_limit         REAL    NOT NULL DEFAULT 0,
    leaderboard_visible  INTEGER NOT NULL DEFAULT 1,
    updated_at           INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE TABLE IF NOT EXISTS budget_terms (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    start_date TEXT    NOT NULL,
    end_date   TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_budget_terms_user ON budget_terms(user_id);

  CREATE TABLE IF NOT EXISTS budget_holidays (
    id       TEXT PRIMARY KEY,
    user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date     TEXT NOT NULL,
    name     TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_budget_holidays_user ON budget_holidays(user_id);
`)

// Migrations — use try/catch since ALTER TABLE fails if column already exists
try { db.prepare('ALTER TABLE sessions ADD COLUMN last_task_name TEXT').run() } catch { /* already exists */ }
try { db.prepare('ALTER TABLE sessions ADD COLUMN share_last_task INTEGER NOT NULL DEFAULT 1').run() } catch { /* already exists */ }
try { db.prepare('ALTER TABLE tasks ADD COLUMN due_date INTEGER').run() } catch { /* already exists */ }

// Seed quotes from quotes.txt if table is empty
const quoteCount = (db.prepare('SELECT COUNT(*) as c FROM quotes').get() as { c: number }).c
if (quoteCount === 0) {
  try {
    const quotesPath = join(__dirname, '../quotes.txt')
    const lines = readFileSync(quotesPath, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean)
    const insert = db.prepare('INSERT OR IGNORE INTO quotes (text) VALUES (?)')
    const insertMany = db.transaction((quotes: string[]) => {
      for (const q of quotes) insert.run(q)
    })
    insertMany(lines)
  } catch { /* quotes.txt not found, skip */ }
}

export default db
