/**
 * WorkTree AI (@worktree/protocol) - IPC & Telemetry Contracts
 * Shared across wt-daemon (Rust/Tauri), wt-ide (VS Code), and wt-cloud (FastAPI)
 */

export const PROTOCOL_VERSION = "1.0" as const;

export interface ReflogDelta {
  hard_resets_24h: number;
  stash_drops_24h: number;
  commits_pushed_24h: number;
}

export interface WorktreeContextHeartbeat {
  protocol_version: typeof PROTOCOL_VERSION;
  event: "WORKTREE_CONTEXT_HEARTBEAT";
  timestamp_utc: string; // ISO 8601
  workspace_repo: string;
  branch_name: string;
  inferred_ticket_key: string | null;
  active_ast_symbol: string | null;
  reflog_delta: ReflogDelta;
}

export type ChannelMode = "CH1_MIC_ONLY" | "DUAL_CH1_CH2";

export type SpoolStatus =
  | "QUEUED_FOR_IDLE"
  | "PROCESSING_LOCAL"
  | "FALLBACK_CLOUD"
  | "COMPLETED";

export interface SpoolJob {
  spool_id: string;
  meeting_id: string;
  opus_file_path: string;
  channel_mode: ChannelMode;
  duration_seconds: number;
  call_ended_at: string; // ISO 8601
  spool_status: SpoolStatus;
  retry_count: number;
}

export interface TribalMemoryCard {
  symbol_hash: string;
  ast_symbol_path: string;
  ticket_key: string | null;
  pr_number: number | null;
  summary_rationale: string;
  audio_clip_local_url: string | null;
  recorded_date: string;
  author_role_alias: string;
}

export interface SilentBlockerPayload {
  ticket_key: string;
  branch_name: string;
  peer_huddles_count: number;
  peer_huddle_minutes: number;
  git_resets_count: number;
  first_detected_at: string;
  grace_window_expires_at: string;
  resolution_state: "QUARANTINED" | "SELF_RESOLVED_PURGED" | "DEV_ESCALATED" | "EXTENDED_24H";
}
