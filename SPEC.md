# WorkTree AI (worktree.ai) — Master Product & Domain Specification
*Version: 1.0.0-MVP*  
*Classification: Core Enterprise Architecture & Product Blueprint*

---

## 1. Executive Summary & Core Thesis
Software engineering organizations suffer from **Observability Survivorship Bias**. Conventional tooling (GitHub PRs, Jira changelogs, LinearB, and post-facto DORA dashboards) only captures the **20% sanitized output** of successful work after `git push`. 

**WorkTree AI (`worktree.ai`)** captures the **80% Pre-Commit Dark Matter**—unpushed local thrashing, unmonitored peer huddles, local branch reflog resets, verbal scope creep, and unspoken architectural reasoning. By running as a lightweight edge utility (`wt-daemon` + `wt-ide`) anchored directly to the developer's working tree, WorkTree AI provides zero-latency capture, eliminates morning status meetings via 90-second commute briefs, and preserves company tribal memory when senior engineers depart.

---

## 2. Two-Stage "Trojan Horse" Onboarding & Core Modules

### Stage 1 (Day 1, Minute 0 — Zero Binary Install)
- **180-Day Git/Jira Historical Backfill:** Connects via OAuth to GitHub/GitLab, Jira/Linear, and Slack. Within 15 minutes, indexes 6 months of merged PR review discussions, commit blame graphs, and P1/P2 incident post-mortems.
- **IDE Ambient Context Whisperer (`wt-ide`):** Matches active file paths and AST symbols in VS Code / JetBrains against historical PR debates and recorded audio snippets, surfacing a non-intrusive HUD card explaining *why* legacy code was written.
- **Friday 4:00 PM One-Click VP Pack (`wt-web`):** Automatically compiles weekly DORA + SPACE flow metrics, sprint burn-downs, and blocker summaries into an executive slide deck for Delivery Managers.

### Stage 2 (Day 7+ — Native Edge Audio & Pre-Commit Dark Matter)
- **90-Second Commute Audio Brief:** Replaces the 9:30 AM synchronous standup with a pre-cached 90-second neural TTS audio flash + 3-bullet action card delivered via Slack/Teams/Mobile by 8:00 AM.
- **Silent Blocker Radar (SBR) with 48-Hour Grace Window:** Detects pre-commit failure loops locally ($\ge 3$ peer huddles + $\ge 4$ local `.git` resets in 24 hours). Quarantines data locally for 48 hours; purges permanently if self-resolved, or lets the developer trigger a "Hero-Framed" architectural review request.
- **Client Requirement Volatility (CRV) & Scope-Creep Detector:** Compares verbal client/PM feature requests on calls against locked Jira sprint scope, auto-drafting billable Change Requests (CRs) with timestamped quotes.
- **90-Day Notice-Period Auto-KT Generator:** One-click offboarding workflow that converts a departing engineer's historical design calls and PR walkthroughs into PII-scrubbed Markdown ADRs and a Synthetic Neural TTS Q&A Bot.

---

## 3. Core Mathematical Formulas

### 3.1 Client Requirement Volatility (CRV) / Talk-to-Ship Ratio (TSR)
$$\text{TSR}_{\text{Ticket}} = \frac{\sum \text{Synchronous Call \& Huddle Minutes Attributed to Ticket}}{\text{Story Points (or Normalized PR Complexity)}}$$
$$\text{CRV Index} = \frac{\text{TSR}_{\text{Current Ticket}}}{\mu(\text{TSR}_{\text{Historical Baseline}})}$$
- **Healthy:** $\le 1.25$ | **Volatility Warning:** $1.25 - 2.0$ | **Uncontracted Scope / Impasse Alert:** $> 2.0$.

### 3.2 Silent Blocker Radar (SBR) Anomaly Score
$$\text{SBR Score} = 0.40 \left(\frac{H_{24}}{\bar{H}}\right) + 0.35 \left(\frac{R_{24}}{\bar{R}}\right) + 0.25 \left(\frac{T_{\text{stagnant}}}{T_{\text{SLA}}}\right)$$
- Triggers local developer HUD prompt when $\text{SBR Score} \ge 0.80$ after the 48-hour local grace window.

### 3.3 Maker-Time Reclaimed (Weekly)
$$\text{Maker Time Reclaimed (hrs)} = \sum \text{Status Calls Converted to Commute Briefs} \times (T_{\text{meeting}} + 0.387 \text{ hrs Attention Residue})$$

---

## 4. Asymmetric Pod Pricing & Unit Economics (India B2B)
- **Contributor Seat (Developers — ~85% of org):** **₹399 / user / month** (Local capture, Commute Audio Brief, IDE Ambient Whisperer).
- **Intelligence Seat (Tech Leads, EMs, Delivery Heads, CTO — ~15% of org):** **₹1,999 / user / month** (CRV Change Request Generator, Friday 4 PM VP Pack, Squad Maker-Time & DORA/SPACE Dashboards).
- **Auto-KT Offboarding Event Pack:** **₹9,999 one-time** per departing engineer.
- **Target COGS:** **₹68.77 / developer / month** (via `SpoolAndWaitForIdle` on-device edge ASR).
- **Blended Gross Margin:** **87.3%** | **100-Seat Annual Contract:** **~₹7.66 Lakhs Base (~₹9.47 Lakhs with 18 Auto-KT Packs)**.
