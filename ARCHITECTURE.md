# ARCHITECTURE.md — Monorepo Topology, VDI Bridge & Database DDL
*System Blueprint for WorkTree AI (`worktree.ai`)*

---

## 1. Monorepo Directory Structure
```text
/worktree-ai
├── SPEC.md
├── AGENTS.md
├── ARCHITECTURE.md
├── PRIVACY_AND_DPDP.md
├── TASKS.md
├── apps/
│   ├── wt-daemon/                  # Rust/Tauri native macOS & Windows edge companion
│   │   ├── src-tauri/
│   │   │   ├── audio_tap/          # CoreAudio Process Tap (macOS) & WASAPI (Win)
│   │   │   ├── spooler/            # SpoolAndWaitForIdle Opus disk queue & RAM governor
│   │   │   ├── consent_guard/      # FailClosedChannel2Guard calendar/roster verifier
│   │   │   ├── ipc_server/         # Local TCP/Named-Pipe listener (127.0.0.1:49152)
│   │   │   └── storage/            # Tier-0 SQLCipher + sqlite-vec local DB
│   ├── wt-ide/                     # VS Code / JetBrains extension (local + remote VDI/SSH)
│   │   ├── src/
│   │   │   ├── git_watcher.ts      # Watches .git/HEAD and .git/logs/HEAD
│   │   │   ├── ast_tracker.ts      # Tree-sitter symbol extractor on cursor dwell (>4s)
│   │   │   ├── whisperer_hud.ts    # Non-intrusive CodeLens / hover Tribal Memory card
│   │   │   └── ipc_bridge.ts       # Forwards JSON metadata over SSH reverse tunnel
│   └── wt-web/                     # Next.js 15 Enterprise Manager & Auto-KT Portal
├── services/
│   └── wt-cloud/                   # Python 3.12 FastAPI + Celery + Redis backend
│       ├── app/
│       │   ├── api/                # REST & WebSocket endpoints
│       │   ├── workers/
│       │   │   ├── backfill.py     # Stage-1 180-Day Git/Jira OAuth backfill engine
│       │   │   ├── asr_fallback.py # 15% AWS Mumbai g5.xlarge GPU fallback worker
│       │   │   ├── commute_tts.py  # 8:00 AM 90-sec audio brief generator
│       │   │   ├── crv_scope.py    # Verbal scope-creep vs Jira sprint comparator
│       │   │   └── auto_kt_adr.py  # Voice-to-Synthetic-ADR anonymizer
│       │   └── models/             # SQLAlchemy 2.0 + pgvector schemas
└── packages/
    └── wt-protocol/                # Shared JSON-Schema & TypeScript/Rust types
```

---

## 2. Host-to-Remote VDI / WSL2 / SSH Split-Brain IPC Contract
When a developer runs Zoom/Teams on their physical host laptop (`wt-daemon`) while coding inside a remote Citrix VDI, AWS WorkSpace, or SSH Linux container (`wt-ide`):
- **Channel:** Reverse SSH port forward or Citrix Virtual Channel bound to `127.0.0.1:49152`.
- **Auth:** Per-session HMAC-SHA256 token exchanged during IDE handshake.
- **DLP Guarantee:** Zero source code lines traverse the socket; only git reflog event counts, Jira ticket keys, and AST symbol paths are transmitted.

```json
{
  "protocol_version": "1.0",
  "event": "WORKTREE_CONTEXT_HEARTBEAT",
  "timestamp_utc": "2026-10-16T09:30:12Z",
  "workspace_repo": "org/payment-service",
  "branch_name": "fix/PROD-4029-hmac-timeout",
  "inferred_ticket_key": "PROD-4029",
  "active_ast_symbol": "services/settlement/PaymentReconciler.ts#reconcileBatch",
  "reflog_delta": {
    "hard_resets_24h": 3,
    "stash_drops_24h": 1,
    "commits_pushed_24h": 0
  }
}
```

---

## 3. Database Schemas (SQL DDL)

### 3.1 Tier-0 Local Device Database (`~/.worktree/local_tier0.db` — SQLCipher + sqlite-vec)
```sql
-- Spool queue for Deferred Post-Call Idle Spooling (Fix 1)
CREATE TABLE local_audio_spool (
    spool_id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    opus_file_path TEXT NOT NULL,
    channel_mode TEXT CHECK(channel_mode IN ('CH1_MIC_ONLY', 'DUAL_CH1_CH2')) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    call_ended_at DATETIME NOT NULL,
    spool_status TEXT CHECK(spool_status IN ('QUEUED_FOR_IDLE', 'PROCESSING_LOCAL', 'FALLBACK_CLOUD', 'COMPLETED')) DEFAULT 'QUEUED_FOR_IDLE',
    retry_count INTEGER DEFAULT 0
);

-- 48-Hour Private Quarantine Table (Invariant 2)
CREATE TABLE local_friction_quarantine (
    ticket_key TEXT PRIMARY KEY,
    branch_name TEXT NOT NULL,
    peer_huddles_count INTEGER DEFAULT 0,
    peer_huddle_minutes REAL DEFAULT 0.0,
    git_resets_count INTEGER DEFAULT 0,
    first_detected_at DATETIME NOT NULL,
    grace_window_expires_at DATETIME NOT NULL, -- first_detected_at + 48 hours
    resolution_state TEXT CHECK(resolution_state IN ('QUARANTINED', 'SELF_RESOLVED_PURGED', 'DEV_ESCALATED', 'EXTENDED_24H')) DEFAULT 'QUARANTINED'
);

-- Local Vector Cache for Sub-Second IDE Ambient Context Whisperer
CREATE TABLE local_symbol_memory_cache (
    symbol_hash TEXT PRIMARY KEY,
    ast_symbol_path TEXT NOT NULL,
    ticket_key TEXT,
    pr_number INTEGER,
    summary_rationale TEXT NOT NULL,
    audio_clip_local_url TEXT,
    recorded_date TEXT NOT NULL,
    embedding BLOB -- 384-dim quantized float32 vector for sqlite-vec
);
```

### 3.2 Tier-1 & Tier-2 Cloud Database (AWS Mumbai `ap-south-1` — PostgreSQL 16 + pgvector)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_name VARCHAR(255) NOT NULL,
    verified_email_domains TEXT[] NOT NULL, -- e.g. ARRAY['company.com']
    dpdp_retention_days INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE squads (
    squad_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    squad_name VARCHAR(120) NOT NULL,
    parent_department_id UUID,
    active_member_count INTEGER NOT NULL DEFAULT 0
);

-- Historical Backfill & Live Tribal Memory Graph (Tier 2)
CREATE TABLE tribal_knowledge_nodes (
    node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    source_type VARCHAR(32) CHECK (source_type IN ('GITHUB_PR_REVIEW', 'JIRA_POSTMORTEM', 'MEETING_ADR', 'CH1_INVERSE_INFERENCE')),
    ast_symbol_paths TEXT[] NOT NULL,
    ticket_key VARCHAR(64),
    pr_id VARCHAR(64),
    author_role_alias VARCHAR(120) NOT NULL, -- Anonymized role e.g. 'Staff Architect [Settlement]'
    rationale_markdown TEXT NOT NULL,
    synthetic_tts_audio_s3_key TEXT,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tribal_nodes_embedding ON tribal_knowledge_nodes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_tribal_nodes_symbols ON tribal_knowledge_nodes USING gin (ast_symbol_paths);

-- Client Requirement Volatility & Scope Creep Audit Log
CREATE TABLE scope_drift_events (
    drift_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads(squad_id),
    sprint_id VARCHAR(64) NOT NULL,
    spoken_commitment_summary TEXT NOT NULL,
    closest_jira_ticket_key VARCHAR(64),
    cosine_similarity_to_sprint REAL NOT NULL, -- Flagged when < 0.65
    estimated_story_point_impact REAL NOT NULL,
    status VARCHAR(32) CHECK (status IN ('FLAGGED', 'CONVERTED_TO_BILLED_CR', 'DISMISSED')) DEFAULT 'FLAGGED',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce k >= 5 Differential Privacy View for Manager Dashboards
CREATE VIEW v_squad_flow_metrics_k5 AS
SELECT
    s.tenant_id,
    CASE WHEN s.active_member_count >= 5 THEN s.squad_id ELSE s.parent_department_id END AS reporting_unit_id,
    COUNT(DISTINCT s.squad_id) AS aggregated_squads,
    SUM(s.active_member_count) AS total_engineers
FROM squads s
GROUP BY s.tenant_id, CASE WHEN s.active_member_count >= 5 THEN s.squad_id ELSE s.parent_department_id END
HAVING SUM(s.active_member_count) >= 5;
```
