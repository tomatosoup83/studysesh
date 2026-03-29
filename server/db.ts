import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../data/studysesh.db')

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

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
`)

export default db
