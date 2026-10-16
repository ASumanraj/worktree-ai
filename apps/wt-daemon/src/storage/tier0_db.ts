import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

export interface DBConfig {
  dbPath?: string;
}

export function getWorktreeDir(): string {
  const dir = path.join(os.homedir(), ".worktree");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function initTier0DB(config: DBConfig = {}): DatabaseSync {
  const finalPath = config.dbPath || path.join(getWorktreeDir(), "local_tier0.db");
  const db = new DatabaseSync(finalPath);

  // Enable WAL mode for high concurrent throughput
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");

  // Invariant 2: 48-Hour Quarantine Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_friction_quarantine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_key TEXT NOT NULL UNIQUE,
      branch_name TEXT NOT NULL,
      workspace_repo TEXT NOT NULL,
      resets_count INTEGER DEFAULT 0,
      peer_huddles_count INTEGER DEFAULT 0,
      quarantined_at TEXT NOT NULL,
      grace_window_expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'QUARANTINED',
      unblock_prompt_shown INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS local_audio_spool (
      meeting_id TEXT PRIMARY KEY,
      spool_path TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      captured_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'WAITING_FOR_IDLE',
      channel_mode TEXT NOT NULL DEFAULT 'CH1_ONLY'
    );
  `);

  return db;
}
