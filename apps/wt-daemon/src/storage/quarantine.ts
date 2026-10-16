import { DatabaseSync } from "node:sqlite";

export interface FrictionRecord {
  id?: number;
  ticket_key: string;
  branch_name: string;
  workspace_repo: string;
  resets_count: number;
  peer_huddles_count: number;
  quarantined_at: string;
  grace_window_expires_at: string;
  status: "QUARANTINED" | "SELF_RESOLVED_PURGED" | "UNBLOCKED_ESCALATED";
  unblock_prompt_shown: number;
}

export class QuarantineEngine {
  constructor(private db: DatabaseSync) {}

  /**
   * Records or updates friction signals (branch resets, peer huddles)
   * Enforces a 48-hour quarantine lock before anything can ever sync upward.
   */
  public recordFriction(
    ticketKey: string,
    branchName: string,
    repo: string,
    resets: number,
    huddles: number,
    now: Date = new Date()
  ): FrictionRecord {
    const quarantinedAt = now.toISOString();
    // 48 hours in milliseconds
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO local_friction_quarantine (
        ticket_key, branch_name, workspace_repo, resets_count, peer_huddles_count,
        quarantined_at, grace_window_expires_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'QUARANTINED')
      ON CONFLICT(ticket_key) DO UPDATE SET
        resets_count = resets_count + excluded.resets_count,
        peer_huddles_count = peer_huddles_count + excluded.peer_huddles_count,
        branch_name = excluded.branch_name,
        workspace_repo = excluded.workspace_repo
      RETURNING *;
    `);

    return stmt.get(ticketKey, branchName, repo, resets, huddles, quarantinedAt, expiresAt) as FrictionRecord;
  }

  /**
   * INVARIANT 2: Self-Resolution Wipe
   * If a valid git commit or push occurs on the tracked branch before grace_window_expires_at,
   * execute an immediate DELETE FROM local_friction_quarantine WHERE ticket_key = ?
   */
  public handleCommitDetected(ticketKey: string, now: Date = new Date()): boolean {
    const checkStmt = this.db.prepare("SELECT * FROM local_friction_quarantine WHERE ticket_key = ?");
    const record = checkStmt.get(ticketKey) as FrictionRecord | undefined;

    if (!record) return false;

    const expiresAt = new Date(record.grace_window_expires_at);
    if (now.getTime() <= expiresAt.getTime()) {
      // Invariant 2 Mandate: Self-resolved within 48h -> Complete purge from local DB
      const deleteStmt = this.db.prepare("DELETE FROM local_friction_quarantine WHERE ticket_key = ?");
      deleteStmt.run(ticketKey);
      return true;
    }

    return false;
  }

  /**
   * INVARIANT 2: Serialization Guard
   * Any background sync worker attempting to transmit local_friction_quarantine rows
   * where now < grace_window_expires_at MUST be blocked at the serialization layer.
   */
  public getEligibleSyncPayload(now: Date = new Date()): FrictionRecord[] {
    const currentIso = now.toISOString();
    // Only return records where the 48-hour grace window has legitimately expired
    const stmt = this.db.prepare(`
      SELECT * FROM local_friction_quarantine
      WHERE grace_window_expires_at <= ? AND status = 'QUARANTINED'
    `);
    return stmt.all(currentIso) as FrictionRecord[];
  }

  /**
   * Get all active quarantined records for the private developer HUD
   */
  public getActiveQuarantined(now: Date = new Date()): FrictionRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM local_friction_quarantine
      WHERE status = 'QUARANTINED'
      ORDER BY quarantined_at DESC
    `);
    return stmt.all() as FrictionRecord[];
  }
}
