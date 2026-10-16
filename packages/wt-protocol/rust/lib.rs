use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub const PROTOCOL_VERSION: &str = "1.0";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ReflogDelta {
    pub hard_resets_24h: u32,
    pub stash_drops_24h: u32,
    pub commits_pushed_24h: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorktreeContextHeartbeat {
    pub protocol_version: String,
    pub event: String,
    pub timestamp_utc: DateTime<Utc>,
    pub workspace_repo: String,
    pub branch_name: String,
    pub inferred_ticket_key: Option<String>,
    pub active_ast_symbol: Option<String>,
    pub reflog_delta: ReflogDelta,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ChannelMode {
    Ch1MicOnly,
    DualCh1Ch2,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SpoolStatus {
    QueuedForIdle,
    ProcessingLocal,
    FallbackCloud,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SpoolJob {
    pub spool_id: String,
    pub meeting_id: String,
    pub opus_file_path: String,
    pub channel_mode: ChannelMode,
    pub duration_seconds: u32,
    pub call_ended_at: DateTime<Utc>,
    pub spool_status: SpoolStatus,
    pub retry_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TribalMemoryCard {
    pub symbol_hash: String,
    pub ast_symbol_path: String,
    pub ticket_key: Option<String>,
    pub pr_number: Option<u32>,
    pub summary_rationale: String,
    pub audio_clip_local_url: Option<String>,
    pub recorded_date: String,
    pub author_role_alias: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heartbeat_serialization() {
        let heartbeat = WorktreeContextHeartbeat {
            protocol_version: PROTOCOL_VERSION.to_string(),
            event: "WORKTREE_CONTEXT_HEARTBEAT".to_string(),
            timestamp_utc: Utc::now(),
            workspace_repo: "org/payment-service".to_string(),
            branch_name: "fix/PROD-4029".to_string(),
            inferred_ticket_key: Some("PROD-4029".to_string()),
            active_ast_symbol: Some("services/settlement/PaymentReconciler.ts#reconcileBatch".to_string()),
            reflog_delta: ReflogDelta {
                hard_resets_24h: 3,
                stash_drops_24h: 1,
                commits_pushed_24h: 0,
            },
        };

        let json = serde_json::to_string(&heartbeat).expect("Must serialize");
        assert!(json.contains("PROD-4029"));
        let parsed: WorktreeContextHeartbeat = serde_json::from_str(&json).expect("Must deserialize");
        assert_eq!(parsed.reflog_delta.hard_resets_24h, 3);
    }
}
