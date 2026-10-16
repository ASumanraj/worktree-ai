# TASKS.md — Ordered 4-Week MVP Execution Backlog for AI Coding Agents
*Execute tasks sequentially. Read `AGENTS.md` and `ARCHITECTURE.md` before starting any task.*

---

## Sprint Week 1: Monorepo Foundation & Stage-1 "Trojan Horse" (Zero Binary Install)

- [x] **TASK-01: Initialize Monorepo & Shared IPC Protocol (`/packages/wt-protocol`)**
  - **Files:** `package.json`, `pnpm-workspace.yaml`, `packages/wt-protocol/src/schema.ts`, `packages/wt-protocol/rust/lib.rs`.
  - **Deliverable:** Define shared TypeScript and Rust structs for `WorktreeContextHeartbeat`, `SpoolJob`, and `TribalMemoryCard`.
  - **Test Gate:** `pnpm --filter wt-protocol test && cargo test --manifest-path packages/wt-protocol/Cargo.toml`.

- [x] **TASK-02: Cloud Database & $k \ge 5$ Privacy Views (`/services/wt-cloud`)**
  - **Files:** `services/wt-cloud/app/models/entities.py`, `services/wt-cloud/alembic/versions/001_initial_pgvector.py`.
  - **Deliverable:** Implement `tenants`, `squads`, `tribal_knowledge_nodes` (`pgvector` HNSW), `scope_drift_events`, and `v_squad_flow_metrics_k5`.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_privacy_k5_views.py -v` (Verify queries with $<5$ squad members roll up to parent org).

- [x] **TASK-03: Stage-1 180-Day GitHub PR & Jira Historical Backfill Worker (`/services/wt-cloud`)**
  - **Files:** `services/wt-cloud/app/workers/backfill.py`, `services/wt-cloud/app/api/oauth_onboarding.py`.
  - **Deliverable:** Async Celery pipeline that ingests 6 months of merged PR review comments, commit blame file paths, and closed Jira bug descriptions, generating `tribal_knowledge_nodes` in $<15$ minutes.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_historical_backfill.py -v`.

- [x] **TASK-04: VS Code Extension — Git Watcher, AST Tracker & Ambient Whisperer HUD (`/apps/wt-ide`)**
  - **Files:** `apps/wt-ide/src/git_watcher.ts`, `apps/wt-ide/src/ast_tracker.ts`, `apps/wt-ide/src/whisperer_hud.ts`.
  - **Deliverable:** Watch `.git/logs/HEAD` (local and remote SSH/WSL2), extract active `tree-sitter` function/class symbols on 4-second cursor dwell, and render the non-intrusive Tribal Memory hover card.
  - **Test Gate:** `pnpm --filter wt-ide test`.

---

## Sprint Week 2: Native Desktop Audio Daemon, Fail-Closed Guard & Idle Spooler

- [ ] **TASK-05: Tier-0 Local SQLCipher Database & 48-Hour Quarantine Engine (`/apps/wt-daemon`)**
  - **Files:** `apps/wt-daemon/src-tauri/src/storage/tier0_db.rs`, `apps/wt-daemon/src-tauri/src/storage/quarantine.rs`.
  - **Deliverable:** Implement `local_audio_spool` and `local_friction_quarantine` with deterministic 48-hour sync lock and automatic `SELF_RESOLVED_PURGED` deletion when a commit is pushed on the active branch.
  - **Test Gate:** `cargo test --manifest-path apps/wt-daemon/Cargo.toml test_48h_quarantine_purge`.

- [ ] **TASK-06: Dual-Channel Audio Tap & `FailClosedChannel2Guard` (`/apps/wt-daemon`)**
  - **Files:** `apps/wt-daemon/src-tauri/src/audio_tap/macos_tap.rs`, `apps/wt-daemon/src-tauri/src/audio_tap/windows_wasapi.rs`, `apps/wt-daemon/src-tauri/src/consent_guard/mod.rs`.
  - **Deliverable:** Capture Ch1 (Mic) and Ch2 (Process Loopback) encoded to 16kHz mono Opus. Enforce `FailClosedChannel2Guard`: hard-mute Ch2 unless Calendar Event ID matches 100% internal `@company.com` domains and window title/roster has zero `[External]`/`[Guest]` tags.
  - **Test Gate:** `cargo test --manifest-path apps/wt-daemon/Cargo.toml test_fail_closed_channel2_guard`.

- [ ] **TASK-07: Deferred Post-Call Idle Spooler & RAM Governor (`SpoolAndWaitForIdle`) (`/apps/wt-daemon`)**
  - **Files:** `apps/wt-daemon/src-tauri/src/spooler/ram_governor.rs`, `apps/wt-daemon/src-tauri/src/spooler/edge_asr.rs`.
  - **Deliverable:** Spool Opus frames to disk during live calls (`<15MB` RAM). Poll system RAM/CPU every 60s post-call; run local `IndicConformer-INT4` / `Whisper-INT8` when RAM $<84\%$ and CPU $<60\%$, falling back to AWS Mumbai GPU queue only on explicit user click or $>45$-min starvation.
  - **Test Gate:** `cargo test --manifest-path apps/wt-daemon/Cargo.toml test_spool_and_wait_for_idle`.

- [ ] **TASK-08: Host-to-Remote VDI / SSH Local IPC Loopback Server (`/apps/wt-daemon` & `/apps/wt-ide`)**
  - **Files:** `apps/wt-daemon/src-tauri/src/ipc_server/mod.rs`, `apps/wt-ide/src/ipc_bridge.ts`.
  - **Deliverable:** Bind `127.0.0.1:49152` with HMAC auth so `wt-ide` inside WSL2/SSH/Citrix streams branch and AST metadata to `wt-daemon`.
  - **Test Gate:** `cargo test --manifest-path apps/wt-daemon/Cargo.toml test_vdi_ipc_handshake`.

---

## Sprint Week 3: Context-Biased Indic ASR, Inverse Inference & Commute Briefs

- [ ] **TASK-09: Pre-Meeting Hotword Lexicon Compiler & AST Symbol Linker (`/services/wt-cloud`)**
  - **Files:** `services/wt-cloud/app/workers/lexicon_compiler.py`, `services/wt-cloud/app/workers/ast_linker.py`.
  - **Deliverable:** 15 minutes before scheduled calls, compile active sprint Jira keys, repo names, and Indian attendee names into a hotword biasing prefix; post-call, link transcript segments to AST file symbols.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_lexicon_and_ast_linker.py -v`.

- [ ] **TASK-10: Channel-1 Inverse LLM Inference Engine for External Client Calls (`/services/wt-cloud`)**
  - **Files:** `services/wt-cloud/app/workers/ch1_inverse_inference.py`.
  - **Deliverable:** Extract client requirements, action items, and scope additions strictly from the internal developer's Channel-1 microphone transcript when Channel 2 was muted on external calls.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_ch1_inverse_inference.py -v`.

- [ ] **TASK-11: 8:00 AM 90-Second Commute Audio Brief & Slack/Teams Action Card (`/services/wt-cloud`)**
  - **Files:** `services/wt-cloud/app/workers/commute_tts.py`, `services/wt-cloud/app/integrations/slack_teams_cards.py`.
  - **Deliverable:** Synthesize overnight PR merges, Jira movements, and yesterday's call blockers into a 90-second neural TTS audio brief + 1-click Slack/Teams approval card.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_commute_brief_pipeline.py -v`.

---

## Sprint Week 4: Upward-Hero Manager Suite, Auto-KT & Asymmetric Billing Gates

- [ ] **TASK-12: Client Requirement Volatility (CRV) & Billed Change Request Generator (`/services/wt-cloud` & `/apps/wt-web`)**
  - **Files:** `services/wt-cloud/app/workers/crv_scope.py`, `apps/wt-web/src/app/dashboard/scope-volatility/page.tsx`.
  - **Deliverable:** Detect spoken commitments with cosine similarity $<0.65$ to active sprint backlog and auto-draft exportable Change Request (CR) documents for Delivery Managers.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_crv_scope_detector.py -v`.

- [ ] **TASK-13: Friday 4:00 PM One-Click Executive VP Slide Pack Generator (`/services/wt-cloud` & `/apps/wt-web`)**
  - **Files:** `services/wt-cloud/app/workers/friday_vp_pack.py`, `apps/wt-web/src/app/dashboard/vp-pack/page.tsx`.
  - **Deliverable:** Auto-generate Friday steering committee slide deck with DORA/SPACE flow metrics, reclaimed Maker-Time hours, and CRV audit logs.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_friday_vp_pack.py -v`.

- [ ] **TASK-14: 90-Day Notice-Period Auto-KT & Voice-to-Synthetic-ADR Anonymizer (`/services/wt-cloud` & `/apps/wt-web`)**
  - **Files:** `services/wt-cloud/app/workers/auto_kt_adr.py`, `apps/wt-web/src/app/dashboard/auto-kt/page.tsx`.
  - **Deliverable:** Purge raw biometric audio, scrub PII via NER, compile module-by-module Markdown ADRs, and expose the Synthetic Neural TTS Predecessor Q&A Bot.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_auto_kt_dpdp_anonymizer.py -v`.

- [ ] **TASK-15: Asymmetric Pod Billing & Razorpay UPI/NACH Integration (`/services/wt-cloud` & `/apps/wt-web`)**
  - **Files:** `services/wt-cloud/app/billing/asymmetric_tiers.py`, `apps/wt-web/src/app/settings/billing/page.tsx`.
  - **Deliverable:** Enforce role-based seat gates (`₹399/mo` Contributor Seat, `₹1,999/mo` Intelligence Seat, `₹9,999` Auto-KT Event Pack) with GST invoice generation.
  - **Test Gate:** `pytest services/wt-cloud/tests/test_asymmetric_billing_gates.py -v`.
