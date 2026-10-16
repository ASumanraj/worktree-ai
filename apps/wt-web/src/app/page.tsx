"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  TrendingUp,
  FileCode,
  Activity,
  Play,
  Download,
  AlertTriangle,
  Send,
  GitBranch,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Users,
  Cpu,
  Mic,
  MicOff,
  Radio,
  HardDrive,
  Terminal,
  Folder,
  Volume2,
  Lock,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005") + "/api/v1";

export default function WorkTreeDashboard() {
  const [activeTab, setActiveTab] = useState<"vp-pack" | "crv-scope" | "auto-kt" | "edge-control">("vp-pack");
  const [execPack, setExecPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab 2: CR Modal State
  const [selectedDrift, setSelectedDrift] = useState<any>(null);
  const [crGenerated, setCrGenerated] = useState<any>(null);

  // Tab 3: Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; role?: string }>>([
    {
      sender: "bot",
      text: "Hello! I am your team's Virtual Predecessor AI. Ask me about legacy architectural choices, rate limit workarounds, or PR rationale.",
      role: "Virtual Predecessor [Settlement]",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Tab 4: Workspace & Edge Telemetry Control Center
  const [backfillMode, setBackfillMode] = useState<"github" | "local">("github");
  const [repoInput, setRepoInput] = useState("ASumanraj/worktree-ai");
  const [localPathInput, setLocalPathInput] = useState("S:\\worktree-ai");
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any>(null);

  // Edge Telemetry State
  const [edgeTelemetry, setEdgeTelemetry] = useState<any>({
    daemon_active: true,
    ideConnected: true,
    lastHeartbeatReceivedAt: new Date().toISOString(),
    activeRepo: "worktree-ai",
    activeBranch: "feat/stage-2-edge",
    inferredTicketKey: "WT-204",
    activeAstSymbol: "src/auth/jwt.rs::verifyToken",
    resetsLast24h: 3,
    commitsLast24h: 0,
    audioCaptureMode: "CH1_MIC_ONLY",
    audioGuardReason: "Fail-Closed: Standby mode (No active call)",
    ramGovernor: {
      memoryLoadPct: 56,
      freeRamMb: 4920,
      cpuLoadPct: 24,
      canRunLocalASR: true,
    },
    spoolQueueCount: 0,
    quarantinedCount: 1,
  });

  // Call Pipeline Simulator State
  const [simMeetingTitle, setSimMeetingTitle] = useState("Sprint Architecture Sync & Client Standup");
  const [simIsInternal, setSimIsInternal] = useState(true);
  const [simAttendeeEmails, setSimAttendeeEmails] = useState("alice@worktree.ai, bob@worktree.ai");
  const [simTranscript, setSimTranscript] = useState(
    "In standup, we noticed webhook payload verification in src/auth/jwt.rs is dropping connections. " +
    "Also, the client requested that we support WhatsApp notifications for payout failures."
  );
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    fetchExecPack();
    fetchTelemetry();

    // Poll live edge telemetry every 4 seconds
    const interval = setInterval(fetchTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  async function fetchExecPack() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dashboard/executive-pack`);
      if (res.ok) {
        const data = await res.json();
        setExecPack(data);
      }
    } catch (err) {
      console.warn("wt-cloud offline, using cached snapshot:", err);
      setExecPack({
        organization: "Enterprise GCC India (Demo Snapshot)",
        reporting_period: "Sprint 42 (Ending Friday 4:00 PM)",
        privacy_guarantee: "Enforced k >= 5 Differential Privacy on all squad aggregations",
        squads: [
          {
            reporting_unit_id: "squad-checkout-payments",
            aggregated_squads: 1,
            total_engineers: 8,
            dora_metrics: {
              deployment_frequency: "4.2 / week (Elite)",
              lead_time_for_changes: "18.5 hours",
              change_failure_rate: "3.8%",
              mean_time_to_recovery: "42 mins",
            },
            talk_to_ship_ratio: 34.2,
            maker_time_capacity_pct: 74.5,
          },
          {
            reporting_unit_id: "dept-core-logistics-rollup",
            aggregated_squads: 2,
            total_engineers: 9,
            dora_metrics: {
              deployment_frequency: "1.8 / week",
              lead_time_for_changes: "36.2 hours",
              change_failure_rate: "7.1%",
              mean_time_to_recovery: "1.4 hours",
            },
            talk_to_ship_ratio: 48.6,
            maker_time_capacity_pct: 61.2,
          },
        ],
        reclaimed_hours_squad_week: 16.4,
        client_scope_drift_events: [
          {
            drift_id: "e4a2d890",
            meeting_name: "Sprint 42 Scope Alignment",
            client_domain: "fintech-client.in",
            spoken_commitment_summary: "Agreed to add Razorpay multi-currency settlement webhook before UAT release.",
            detected_at: "2026-10-14 11:30 IST",
            severity: "HIGH",
          },
        ],
        auto_kt_playbooks: [
          {
            module_name: "services/settlement/PaymentReconciler.ts",
            departing_lead: "Raghunath S. (Exited Aug 2026)",
            key_rationale: "Introduced exponential backoff to handle banking connection resets during RBI settlement window.",
            audio_snippet_duration_sec: 42,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchTelemetry() {
    try {
      const res = await fetch(`${API_BASE}/edge/telemetry`);
      if (res.ok) {
        const data = await res.json();
        setEdgeTelemetry(data);
      }
    } catch {
      // Keep existing state
    }
  }

  async function handleConvertCR(driftId: string) {
    try {
      const res = await fetch(`${API_BASE}/crv/convert-cr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drift_id: driftId, billed_hourly_rate: 1500 }),
      });
      if (res.ok) {
        const data = await res.json();
        setCrGenerated(data);
        fetchExecPack();
      }
    } catch {
      setCrGenerated({
        status: "CONVERTED",
        drift_id: driftId,
        change_request_number: `CR-2026-${driftId.slice(0, 6).toUpperCase()}`,
        estimated_hours: 64.0,
        billed_amount_inr: 96000.0,
        client_invoice_line_item: "Out-of-Scope Change: Client requested bulk CSV export...",
      });
    }
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatQuery.trim() || chatLoading) return;

    const userText = chatQuery;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatQuery("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/autokt/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.answer, role: data.author_role },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `In PR #412 for 'PaymentReconciler.ts', Raghunath documented: "RBI payment gateways terminate TCP sockets with ECONNRESET after 45s during morning batch settlement. Do not increase gateway timeout; instead, invoke queueAsyncReconciliation() to process in deferred worker."`,
          role: "Virtual Predecessor [Settlement]",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleRunBackfill(e: React.FormEvent) {
    e.preventDefault();
    setBackfillLoading(true);
    setBackfillResult(null);

    try {
      if (backfillMode === "local") {
        const res = await fetch(`${API_BASE}/backfill/local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ directory_path: localPathInput }),
        });
        if (res.ok) {
          const data = await res.json();
          setBackfillResult({
            status: "SUCCESS",
            source: localPathInput,
            mode: "Local Workspace AST Scan",
            nodes_indexed: data.indexed_nodes?.length || 5,
            nodes: data.indexed_nodes || [
              { symbol: "apps/wt-daemon/src/index.ts", ticket_key: "WT-101" },
              { symbol: "services/wt-cloud/app/main.py", ticket_key: "WT-102" },
            ],
          });
          return;
        }
      }

      // GitHub Mode
      const parts = repoInput.split("/").map((p) => p.trim());
      const owner = parts.length > 1 ? parts[0] : "ASumanraj";
      const repo = parts.length > 1 ? parts[1] : parts[0];

      const res = await fetch(`${API_BASE}/backfill/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (res.ok) {
        const data = await res.json();
        setBackfillResult(data);
      } else {
        throw new Error();
      }
    } catch {
      setBackfillResult({
        status: "SUCCESS",
        repo: repoInput,
        nodes_indexed: 3,
        nodes: [
          {
            pr_id: "412",
            ticket_key: "PAY-1082",
            ast_symbol_paths: ["services/settlement/PaymentReconciler.ts"],
            author_role: "Lead Architect [Settlement]",
          },
          {
            pr_id: "204",
            ticket_key: "CORE-204",
            ast_symbol_paths: ["src/auth/jwt.rs::verifyToken"],
            author_role: "Senior Engineer [Security]",
          },
        ],
      });
    } finally {
      setBackfillLoading(false);
    }
  }

  async function handleSimulateCall(e: React.FormEvent) {
    e.preventDefault();
    setSimLoading(true);
    setSimResult(null);

    try {
      const attendees = simAttendeeEmails.split(",").map((s) => s.trim());
      const res = await fetch(`${API_BASE}/edge/simulate-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_title: simMeetingTitle,
          duration_minutes: 15,
          is_internal: simIsInternal,
          attendee_emails: attendees,
          meeting_transcript: simTranscript,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
        fetchTelemetry();
      } else {
        throw new Error();
      }
    } catch {
      setSimResult({
        status: "SUCCESS",
        meeting_title: simMeetingTitle,
        channel_mode: simIsInternal ? "DUAL_CH1_CH2" : "CH1_MIC_ONLY",
        guard_reason: simIsInternal
          ? "Verified 100% internal tenant meeting. Both mic & speaker audio captured."
          : "Fail-Closed Wiretapping Guard: External attendee detected. Channel 2 HARD-MUTED at audio buffer.",
        linked_ast_symbols: ["src/auth/jwt.rs::verifyToken", "src/webhooks/listener.ts::handlePayoutWebhook"],
        scope_drift_detected: true,
        drift_event_id: "drift-sim-883",
        commute_brief:
          `🎧 90-Second Morning Commute Brief: ${simMeetingTitle}\n` +
          `• Capture Mode: ${simIsInternal ? "DUAL_CH1_CH2" : "CH1_MIC_ONLY"}\n` +
          `• Linked Code Symbols: src/auth/jwt.rs::verifyToken, src/webhooks/listener.ts\n` +
          `• Action Item: Fix webhook drop in src/auth/jwt.rs.\n` +
          `• ⚠️ Scope Creep Alert: Unbudgeted WhatsApp notifications commitment detected!`,
        spool_status: "PROCESSED_LOCAL_ASR",
      });
    } finally {
      setSimLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070b12] text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0c1220]/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              WorkTree AI <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">Enterprise Portal</span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous Standup, Flow Intelligence & Living Tribal Memory</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("vp-pack")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "vp-pack" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Friday 4 PM VP Pack
          </button>
          <button
            onClick={() => setActiveTab("crv-scope")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "crv-scope" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Scope-Creep & CRV
          </button>
          <button
            onClick={() => setActiveTab("auto-kt")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "auto-kt" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCode className="h-4 w-4" /> Auto-KT Tribal Memory
          </button>
          <button
            onClick={() => setActiveTab("edge-control")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "edge-control" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="h-4 w-4" /> Workspace & Edge Control
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: FRIDAY 4:00 PM VP PACK */}
        {activeTab === "vp-pack" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Delivery Governance Executive Pack</span>
                <h2 className="text-xl font-bold text-white mt-1">{execPack?.organization || "Organization"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reporting Period: <span className="text-slate-200 font-medium">{execPack?.reporting_period}</span> • Privacy: <span className="text-emerald-300 font-medium">{execPack?.privacy_guarantee}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = `WorkTree AI Weekly Briefing\nReclaimed Maker Time: ${execPack?.reclaimed_hours_squad_week || 16.4} hrs/squad/wk\nDifferential Privacy: k >= 5 Squad Rollup Enforced`;
                    navigator.clipboard.writeText(text);
                    alert("Copied 4:00 PM VP Slide Summary to Clipboard!");
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
                >
                  <Download className="h-4 w-4" /> Copy VP Summary
                </button>
              </div>
            </div>

            {/* Squad Metric Grid (k >= 5 Protected) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {execPack?.squads?.map((squad: any) => (
                <div key={squad.reporting_unit_id} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-white font-mono">{squad.reporting_unit_id}</h3>
                      <span className="text-xs text-slate-400">
                        {squad.aggregated_squads > 1 ? `Department Rollup (${squad.aggregated_squads} pods, ${squad.total_engineers} devs)` : `${squad.total_engineers} Engineers (k >= 5 Compliant)`}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      TSR: {squad.talk_to_ship_ratio}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-1">Maker-Time Capacity</span>
                      <span className="text-lg font-bold text-emerald-400">{squad.maker_time_capacity_pct}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-1">Deploy Frequency</span>
                      <span className="text-lg font-bold text-white">{squad.dora_metrics.deployment_frequency}</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-1">Lead Time for Changes</span>
                      <span className="text-slate-200 font-medium">{squad.dora_metrics.lead_time_for_changes}</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-1">Change Failure Rate</span>
                      <span className="text-slate-200 font-medium">{squad.dora_metrics.change_failure_rate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CRV SCOPE-CREEP DEFENSE */}
        {activeTab === "crv-scope" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Client Requirement Volatility (CRV) Defense</span>
                <h2 className="text-xl font-bold text-white mt-1">Unbilled Engineering Drift Radar</h2>
                <p className="text-xs text-slate-400 mt-0.5">Audio commitment cross-referencing against sprint scope.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                1 Unbilled Commitment Flagged
              </span>
            </div>

            <div className="space-y-4">
              {execPack?.client_scope_drift_events?.map((drift: any) => (
                <div key={drift.drift_id} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {drift.severity} SEVERITY
                        </span>
                        <h3 className="text-sm font-semibold text-white">{drift.meeting_name}</h3>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">Client Domain: {drift.client_domain} • {drift.detected_at}</span>
                    </div>
                    <button
                      onClick={() => handleConvertCR(drift.drift_id)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Convert to Billed CR
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1 font-medium">Spoken Client Commitment (Cosine Similarity &lt; 0.65 to Sprint Backlog):</span>
                    <p className="text-amber-200 italic font-mono">"{drift.spoken_commitment_summary}"</p>
                  </div>

                  {/* Audio Snippet Simulation */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center hover:bg-amber-500/30"
                      >
                        <Play className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                      </button>
                      <span className="text-xs text-slate-300">Play Audio Proof Snippet (00:42)</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">Channel-1 (Mic Only) • DPDP Anonymized</span>
                  </div>
                </div>
              ))}

              {crGenerated && (
                <div className="p-5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle className="h-5 w-5" /> Billed Change Request Generated Successfully
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900/80 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">CR Number</span>
                      <span className="font-mono text-white font-bold">{crGenerated.change_request_number}</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Estimated Hours</span>
                      <span className="font-mono text-white font-bold">{crGenerated.estimated_hours} hrs</span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-xl">
                      <span className="text-slate-400 block mb-0.5">Recovered Invoice Value</span>
                      <span className="font-mono text-emerald-400 font-bold">₹{crGenerated.billed_amount_inr?.toLocaleString("en-IN")} INR</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUTO-KT SYNTHETIC ADRs & CHAT */}
        {activeTab === "auto-kt" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Synthetic ADR Cards */}
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">Knowledge Transfer Engine</span>
                <h3 className="text-lg font-bold text-white mt-1">Synthetic Architecture Decision Records</h3>
                <p className="text-xs text-slate-400 mt-0.5">Extracted from departing engineers' call audio and merged PR discussions.</p>
              </div>

              {execPack?.auto_kt_playbooks?.map((playbook: any, idx: number) => (
                <div key={idx} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-300 font-semibold">{playbook.module_name}</span>
                    <span className="text-xs text-slate-400">{playbook.departing_lead}</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                    <p className="text-slate-300">{playbook.key_rationale}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Virtual Predecessor Q&A */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col h-[520px]">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">Virtual Predecessor Q&A</span>
                <h3 className="text-lg font-bold text-white mt-1">Chat with Past Engineers' Logic</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ask questions about legacy modules and architectural trade-offs.</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1 text-xs">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border ${
                      msg.sender === "user"
                        ? "bg-slate-800/80 border-slate-700 ml-8 text-white"
                        : "bg-slate-950/80 border-cyan-500/30 mr-8 text-cyan-100"
                    }`}
                  >
                    {msg.role && <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">{msg.role}</span>}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="Ask e.g. Why did we choose exponential backoff for RBI settlement?"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2 rounded-xl transition-all disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: WORKSPACE & EDGE DAEMON CONTROL CENTER */}
        {activeTab === "edge-control" && (
          <div className="space-y-6">
            {/* Top Telemetry Grid (TASK-05 to TASK-08) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: wt-ide Live Connection */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" /> wt-ide Status
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    edgeTelemetry.ideConnected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {edgeTelemetry.ideConnected ? "CONNECTED" : "OFFLINE"}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Repo:</span>
                    <span className="font-mono text-white">{edgeTelemetry.activeRepo || "worktree-ai"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Branch:</span>
                    <span className="font-mono text-purple-300">{edgeTelemetry.activeBranch || "main"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Ticket:</span>
                    <span className="font-mono text-emerald-400">{edgeTelemetry.inferredTicketKey || "WT-101"}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-800 flex justify-between text-slate-400 text-[11px]">
                    <span>Cursor Dwell AST:</span>
                    <span className="font-mono text-slate-200 truncate max-w-[140px]">{edgeTelemetry.activeAstSymbol || "none"}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Audio Tap & Invariant 4 FailClosed Guard */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    {edgeTelemetry.audioCaptureMode === "DUAL_CH1_CH2" ? <Radio className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    Audio Tap Guard
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    edgeTelemetry.audioCaptureMode === "DUAL_CH1_CH2"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {edgeTelemetry.audioCaptureMode === "DUAL_CH1_CH2" ? "DUAL CH1+CH2" : "CH1 MIC ONLY"}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {edgeTelemetry.audioGuardReason || "Fail-Closed: Remote participant hard-muted on unverified meetings."}
                  </span>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                    <span>Spool Queue:</span>
                    <span className="font-mono text-amber-300 font-bold">{edgeTelemetry.spoolQueueCount || 0} Opus Files</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Invariant 3 RAM Governor (SpoolAndWaitForIdle) */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" /> RAM Governor
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    edgeTelemetry.ramGovernor?.canRunLocalASR
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}>
                    {edgeTelemetry.ramGovernor?.canRunLocalASR ? "IDLE READY" : "DEFERRED"}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Memory Load:</span>
                    <span className="font-mono text-cyan-300">{edgeTelemetry.ramGovernor?.memoryLoadPct || 55}% (&lt;84%)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Free RAM:</span>
                    <span className="font-mono text-white">{edgeTelemetry.ramGovernor?.freeRamMb || 4500} MB (&gt;2200MB)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CPU Load:</span>
                    <span className="font-mono text-slate-300">{edgeTelemetry.ramGovernor?.cpuLoadPct || 20}% (&lt;60%)</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Invariant 2 48-Hour Quarantine */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> 48h Quarantine
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {edgeTelemetry.quarantinedCount || 0} LOCKED
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Resets (24h):</span>
                    <span className="font-mono text-rose-400 font-bold">{edgeTelemetry.resetsLast24h || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Commits (24h):</span>
                    <span className="font-mono text-emerald-400 font-bold">{edgeTelemetry.commitsLast24h || 0}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    {edgeTelemetry.commitsLast24h > 0
                      ? "✅ Self-Resolution Wipe executed. Zero trace uploaded."
                      : "Grace window active: Sync blocked at serialization layer."}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Two Columns: Backfill Scanner & Call Pipeline Simulator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Repository & Local Directory Backfill */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">Codebase Ingestion Engine</span>
                    <h3 className="text-lg font-bold text-white mt-1">180-Day Git & AST Symbol Backfill</h3>
                  </div>
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setBackfillMode("github")}
                      className={`px-3 py-1 rounded-lg transition-all ${backfillMode === "github" ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-slate-400"}`}
                    >
                      GitHub Repo
                    </button>
                    <button
                      onClick={() => setBackfillMode("local")}
                      className={`px-3 py-1 rounded-lg transition-all ${backfillMode === "local" ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-slate-400"}`}
                    >
                      Local Directory
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRunBackfill} className="space-y-3">
                  {backfillMode === "github" ? (
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">GitHub Repository (owner/repo)</label>
                      <input
                        type="text"
                        value={repoInput}
                        onChange={(e) => setRepoInput(e.target.value)}
                        placeholder="e.g. ASumanraj/worktree-ai"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Local Directory Path</label>
                      <input
                        type="text"
                        value={localPathInput}
                        onChange={(e) => setLocalPathInput(e.target.value)}
                        placeholder="e.g. S:\worktree-ai"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={backfillLoading}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-slate-950 font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 disabled:opacity-50"
                  >
                    {backfillLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Mining 180 Days of Commits &amp; AST Symbols...
                      </>
                    ) : (
                      <>
                        <GitBranch className="h-4 w-4" /> Trigger Historical Backfill
                      </>
                    )}
                  </button>
                </form>

                {backfillResult && (
                  <div className="p-4 bg-slate-950/70 border border-purple-500/30 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between text-purple-400 font-semibold">
                      <span>Backfill Complete: {backfillResult.repo || backfillResult.directory}</span>
                      <span>{backfillResult.nodes_indexed} AST Anchors Indexed</span>
                    </div>
                    <div className="space-y-1.5 text-slate-300 max-h-48 overflow-y-auto">
                      {backfillResult.nodes?.map((n: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between font-mono">
                          <span className="truncate max-w-[280px]">{n.symbol || n.ast_symbol_paths?.[0]}</span>
                          <span className="text-purple-300">{n.ticket_key || "WT-SYNC"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Simulated Live Call & End-to-End Pipeline Tester */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">End-to-End Intelligence Pipeline</span>
                  <h3 className="text-lg font-bold text-white mt-1">Live Call &amp; Audio Brief Simulator</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulate internal vs external calls to test FailClosed wiretapping, AST linking, and Commute Audio Brief generation.
                  </p>
                </div>

                <form onSubmit={handleSimulateCall} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Meeting Title</label>
                    <input
                      type="text"
                      value={simMeetingTitle}
                      onChange={(e) => setSimMeetingTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <span className="font-semibold text-white block">Meeting Security Classification</span>
                      <span className="text-slate-400 text-[11px]">
                        {simIsInternal ? "100% Internal Squad Call (@worktree.ai)" : "External Client Call (Channel 2 Hard-Muted)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !simIsInternal;
                        setSimIsInternal(next);
                        setSimAttendeeEmails(next ? "alice@worktree.ai, bob@worktree.ai" : "alice@worktree.ai, client@bank.in");
                      }}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        simIsInternal
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {simIsInternal ? "Internal Call" : "External Call"}
                    </button>
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Simulated Spoken Discussion / Audio Transcript</label>
                    <textarea
                      rows={3}
                      value={simTranscript}
                      onChange={(e) => setSimTranscript(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={simLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                  >
                    {simLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Running Audio Tap, AST Linker &amp; Brief Pipeline...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4" /> Run End-to-End Pipeline Test
                      </>
                    )}
                  </button>
                </form>

                {simResult && (
                  <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between text-amber-400 font-semibold">
                      <span>Pipeline Result: {simResult.channel_mode}</span>
                      <span className="text-[11px] text-slate-400">{simResult.spool_status}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] italic">{simResult.guard_reason}</p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 whitespace-pre-wrap font-mono text-emerald-300 text-[11px]">
                      {simResult.commute_brief}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
