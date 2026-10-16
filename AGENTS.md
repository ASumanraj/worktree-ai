# AGENTS.md — The WorkTree AI Coding Agent Constitution
*Mandatory operating laws for all AI coding agents (Claude Code, Gemini CLI, Cursor, Antigravity) modifying this repository.*

---

## 1. Hard Architectural Invariants (NEVER VIOLATE)

### Invariant 1: Zero-Surveillance / Anti-Bossware Law
- **FORBIDDEN:** Never write code that captures screen pixels (`ScreenCaptureKit` frame buffers, `BitBlt`), logs keystrokes (`SetWindowsHookEx(WH_KEYBOARD_LL)`), tracks mouse coordinates, or polls webcams.
- **MANDATED:** Context must be derived strictly from:
  1. `.git/logs/HEAD` and `.git/HEAD` file-system events (branch names, commit hashes, reset counts).
  2. Active window title strings via official OS accessibility APIs (`IUIAutomation` on Windows, `AXUIElementCopyAttributeValue` on macOS) filtered strictly by workspace regexes.
  3. Process-specific audio loopbacks (`AudioHardwareCreateProcessTap` on macOS 14.2+, WASAPI Process Loopback on Windows).

### Invariant 2: The 48-Hour Local SQLite Quarantine & Self-Resolution Wipe
- **RULE:** Raw developer friction signals (`git reset --hard`, `git stash drop`, peer huddle counts) MUST be written exclusively to the local encrypted SQLite database (`~/.worktree/local_tier0.db`).
- **RULE:** Any background sync worker attempting to transmit `local_friction_quarantine` rows to `wt-cloud` where `now() < grace_window_expires_at` MUST be blocked at the serialization layer.
- **RULE:** If a valid `git commit` + `git push` occurs on the tracked branch before `grace_window_expires_at`, execute an immediate `DELETE FROM local_friction_quarantine WHERE ticket_key = ?`.

### Invariant 3: Deferred Post-Call Idle Spooling (`SpoolAndWaitForIdle`)
- **RULE:** Never invoke local `whisper.cpp` / `onnxruntime` inference or upload audio to AWS Mumbai GPU queues *while* an audio capture session is active.
- **RULE:** During calls, stream 16kHz mono Opus packets (`~12MB/hr`, `<15MB RAM`) to `~/.worktree/spool/<meeting_id>.opus`.
- **RULE:** Post-call, poll system memory every 60 seconds. Execute local ASR only when `memory_load_pct < 84%` AND `free_ram_mb > 2200` AND `cpu_load_pct < 60%`. Dispatch to `wt-cloud` GPU fallback ONLY if the user clicks `"Transcribe Immediately"` while `memory_load_pct >= 88%` or after 45 minutes of continuous memory starvation.

### Invariant 4: Fail-Closed Channel-2 Wiretapping Guard (`FailClosedChannel2Guard`)
- **RULE:** Before recording Channel 2 (remote participant system audio), `wt-daemon` must verify BOTH:
  1. An active Google/Outlook Calendar event matches the current timestamp and 100% of attendee email domains match the authenticated enterprise tenant domain (`@company.com`), OR the call is a verified internal Slack/Teams Workspace Huddle.
  2. The meeting window accessibility tree contains zero `[Guest]` or `[External]` participant badges.
- **RULE:** If verification fails or is missing (e.g., an ad-hoc Zoom link clicked from WhatsApp/Slack), `wt-daemon` MUST hard-mute Channel 2 at the audio buffer level and capture **Channel 1 (Local Microphone) only**.

### Invariant 5: $k \ge 5$ Squad Differential Privacy
- **RULE:** Every SQL query and API serializer in `wt-cloud` serving manager dashboards (`Maker-Time`, `TSR`, `Attention Residue`) must enforce `HAVING COUNT(DISTINCT developer_id) >= 5`. Teams with $<5$ engineers must automatically roll up to the parent department node.

---

## 2. Tech Stack & Code Conventions
- **Desktop Daemon (`/apps/wt-daemon`):** Rust (stable) + Tauri v2 + `cpal` / native OS audio taps + `rusqlite` (SQLCipher) + `ort` (ONNX Runtime).
- **IDE Extension (`/apps/wt-ide`):** TypeScript (strict mode), VS Code Extension API, `tree-sitter` for AST symbol resolution.
- **Cloud Backend (`/services/wt-cloud`):** Python 3.12, FastAPI, Celery + Redis, SQLAlchemy 2.0 (async), PostgreSQL 16 + `pgvector`, Alembic migrations.
- **Web Dashboard (`/apps/wt-web`):** Next.js 15 (App Router), TypeScript, Tailwind CSS, Recharts.

---

## 3. Mandatory Pre-Commit Verification Commands
Before marking any task in `TASKS.md` complete, the agent must run and pass:
- `cargo test --manifest-path apps/wt-daemon/Cargo.toml`
- `pytest services/wt-cloud/tests -v`
- `pnpm --filter wt-ide test && pnpm --filter wt-web typecheck`
