# PRIVACY_AND_DPDP.md — CISO Security & DPDP Act (May 2027) Compliance Spec
*Security, Wiretapping Defense & Right-to-Erasure Architecture for WorkTree AI (`worktree.ai`)*

---

## 1. The 3-Tier Employee Privacy Ledger

| Tier | Data Scope | Storage Boundary | Retention Policy | Who Can Access |
|---|---|---|---|---|
| **Tier 0: Sovereign Local** | Raw Opus audio spool, verbatim transcripts, `.git/logs/HEAD` branch reset counts, 48-hr blocker quarantine. | Developer's laptop SSD (`~/.worktree/local_tier0.db` encrypted via AES-256 SQLCipher + OS Keychain). | Raw audio deleted immediately post-ASR; quarantine purged on commit or after 14 days. | **Developer ONLY.** Zero cloud sync API exists for Tier 0 tables. |
| **Tier 1: Squad-Aggregated** | Maker-Time blocks ($\ge 120$ min), Attention Residue hours, Epic-level Talk-to-Ship Ratio. | AWS Mumbai (`ap-south-1`) RDS PostgreSQL. | Rolling 90-day window. | Engineering Managers & CTO **strictly at $k \ge 5$ squad level**. |
| **Tier 2: Published Artifacts** | Approved sprint action items, Client Requirement Volatility (CRV) Change Requests, anonymized ADRs. | AWS Mumbai PostgreSQL + S3. | Configurable enterprise retention. | Squad & Organization (requires explicit developer approval or rule opt-in). |

---

## 2. Fail-Closed Wiretapping Defense (`FailClosedChannel2Guard`)
To comply with US Two-Party Consent laws (e.g., California Penal Code § 632), EU GDPR Articles 6/7, and India's DPDP Rules 2025 (full enforcement May 13, 2027):
1. **Default-Mute Channel 2:** Whenever an audio stream begins, Channel 2 (System Audio Loopback) starts in a **HARD_MUTED** state.
2. **Dual Verification Gate:** Channel 2 is unmuted *only* if:
   - `calendar_verifier` confirms a matching Google/Outlook Calendar event where 100% of attendee domains belong to `tenants.verified_email_domains`, AND
   - `window_roster_inspector` detects zero `[External]` or `[Guest]` labels in the active meeting window.
3. **Channel-1 Inverse LLM Inference:** On external client calls or unscheduled ad-hoc links, `wt-daemon` records **only Channel 1 (the employee's microphone)**. Post-call, the LLM infers action items and scope changes from the employee's own spoken confirmations (*"Sure, we can add the bulk CSV export by Friday"*), capturing 100% of business value with **zero third-party wiretapping liability**.

---

## 3. DPDP Section 12 Right-to-Erasure Immunity (Auto-KT Pipeline)
When an enterprise triggers a ₹9,999 Auto-KT Offboarding Pack for a departing engineer:
1. **Step 1 (Biometric Purge):** All raw voice recordings and voiceprint vectors of the departing employee are permanently shredded.
2. **Step 2 (PII Redaction):** Named Entity Recognition (NER) replaces personal identifiers (`"Raghunath"`, email, employee ID) with functional role tokens (`"Lead Settlement Architect"`).
3. **Step 3 (ADR Transformation):** Transcripts are rewritten into structured Markdown **Architectural Decision Records (ADRs)** linked to Git commit diffs (legally classified as corporate *Work Made for Hire* trade secrets, not personal data under DPDP Section 2(t)).
4. **Step 4 (Licensed Neutral TTS):** Audio playback inside the Auto-KT portal uses a generic licensed enterprise neural voice—never a voice clone of the ex-employee.

---

## 4. Endpoint Security (EDR) & OS Permission Compliance
- **macOS 14.2+ / 15+ (Sequoia/Tahoe):** Uses `AudioHardwareCreateProcessTap` for process-scoped audio capture. Never links `ScreenCaptureKit` or requests TCC Screen Recording permissions, eliminating recurring monthly macOS security popups.
- **Windows 10/11 Enterprise:** Signed with a hardware-token Extended Validation (EV) Code Signing Certificate. Uses official `WASAPI` process loopback and `IUIAutomation` window title reads—zero `SetWindowsHookEx` or `ReadProcessMemory` calls, ensuring zero false-positive alerts on CrowdStrike Falcon or Microsoft Defender.
