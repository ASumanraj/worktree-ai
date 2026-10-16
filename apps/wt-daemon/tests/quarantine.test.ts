import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initTier0DB } from "../src/storage/tier0_db.js";
import { QuarantineEngine } from "../src/storage/quarantine.js";

test("TASK-05 / Invariant 2: 48-Hour Quarantine & Self-Resolution Wipe", (t) => {
  // Use in-memory SQLite for testing
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE local_friction_quarantine (
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
  `);

  const quarantine = new QuarantineEngine(db);
  const now = new Date("2026-10-16T12:00:00Z");

  // 1. Developer has 4 git resets on a ticket
  const record = quarantine.recordFriction("AUTH-102", "feat/auth-jwt", "worktree-ai", 4, 2, now);
  assert.equal(record.ticket_key, "AUTH-102");
  assert.equal(record.status, "QUARANTINED");

  // Verify grace window is exactly 48 hours in the future
  const expectedExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  assert.equal(record.grace_window_expires_at, expectedExpiry);

  // 2. Serialization guard: Cloud sync attempts to transmit after 12 hours (MUST BE BLOCKED)
  const syncAttempt12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const blockedPayload = quarantine.getEligibleSyncPayload(syncAttempt12h);
  assert.equal(blockedPayload.length, 0, "Quarantined record must be blocked at serialization layer within 48 hours");

  // 3. Self-Resolution Wipe: Developer pushes a valid commit after 26 hours
  const commitTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const purged = quarantine.handleCommitDetected("AUTH-102", commitTime);
  assert.equal(purged, true, "Self-resolution commit within 48h must purge quarantine record");

  // Verify row is completely deleted from local DB (Zero surveillance trace)
  const remaining = quarantine.getActiveQuarantined();
  assert.equal(remaining.length, 0, "Record must be completely wiped from local SQLite upon commit");
});
