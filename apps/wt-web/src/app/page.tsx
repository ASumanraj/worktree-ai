"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  TrendingUp,
  FileCode,
  DollarSign,
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
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";

export default function WorkTreeDashboard() {
  const [activeTab, setActiveTab] = useState<"vp-pack" | "crv-scope" | "auto-kt" | "backfill-pricing">("vp-pack");
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

  // Tab 4: Backfill & Pricing State
  const [repoInput, setRepoInput] = useState("ASumanraj/worktree-ai");
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any>(null);

  // Pricing calculator sliders
  const [devCount, setDevCount] = useState(85);
  const [leadCount, setLeadCount] = useState(15);
  const [ktEventCount, setKtEventCount] = useState(18);

  useEffect(() => {
    fetchExecPack();
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
      // Fallback demo snapshot if backend is starting
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
              deployment_frequency: "3.1 / week",
              lead_time_for_changes: "24.0 hours",
              change_failure_rate: "5.1%",
              mean_time_to_recovery: "58 mins",
            },
            talk_to_ship_ratio: 38.6,
            maker_time_capacity_pct: 71.0,
          },
        ],
        maker_time_summary: {
          weekly_hours_reclaimed_per_dev: 14.2,
          monthly_squad_deep_work_hours: 966,
          maker_capacity_lift: "+32.5%",
        },
        scope_drift_events: [
          {
            drift_id: "drift-101",
            sprint_id: "Sprint-42",
            spoken_commitment: "Client verbally requested bulk CSV export for monthly reconciliation audit on Friday review call.",
            closest_ticket: "PAY-1082",
            cosine_similarity: 0.48,
            estimated_story_points: 8.0,
            status: "FLAGGED",
            detected_at: "2026-10-15 16:30",
          },
          {
            drift_id: "drift-102",
            sprint_id: "Sprint-42",
            spoken_commitment: "Client requested custom webhook signature with legacy HMAC SHA1 for older banking partner.",
            closest_ticket: "PAY-990",
            cosine_similarity: 0.52,
            estimated_story_points: 5.0,
            status: "CONVERTED_TO_BILLED_CR",
            detected_at: "2026-10-14 11:15",
          },
        ],
        uncontracted_scope_hours_reclaimed: 60.0,
      });
    } finally {
      setLoading(false);
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
        throw new Error("Chat failed");
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: 'According to Lead Architect in PR #412: "HDFC Core Banking rate limiter silently returns HTTP 200 without updating ledger if webhook retry batches are spaced under 500ms. Kept 500ms jittered backoff." Affected file: services/settlement/PaymentReconciler.ts',
          role: "Virtual Predecessor [Settlement]",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleRunBackfill(e: React.FormEvent) {
    e.preventDefault();
    if (!repoInput.trim() || backfillLoading) return;

    const parts = repoInput.split("/").map((p) => p.trim());
    const owner = parts.length > 1 ? parts[0] : "ASumanraj";
    const repo = parts.length > 1 ? parts[1] : parts[0];

    setBackfillLoading(true);
    setBackfillResult(null);

    try {
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
        repo: `${owner}/${repo}`,
        nodes_indexed: 2,
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
            ast_symbol_paths: ["cache/manager.go"],
            author_role: "Senior Engineer [Core]",
          },
        ],
      });
    } finally {
      setBackfillLoading(false);
    }
  }

  // Cost calculation
  const monthlyPlatformFee = devCount * 399 + leadCount * 1999;
  const annualPlatformFee = monthlyPlatformFee * 12;
  const annualKtFee = ktEventCount * 9999;
  const totalAnnualSpend = annualPlatformFee + annualKtFee;

  // 1 Scrum Master comparison in India (INR 11.08L total cost of employment)
  const singleScrumMasterCost = 1108300;
  const costDiff = singleScrumMasterCost - totalAnnualSpend;

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
            onClick={() => setActiveTab("backfill-pricing")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "backfill-pricing" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="h-4 w-4" /> Backfill & ROI Model
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
              <button
                onClick={() => alert("Exporting Executive Slide Deck (PDF/PPTX) with DORA + SPACE flow metrics...")}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all"
              >
                <Download className="h-4 w-4" /> Export Friday VP Deck (.pptx)
              </button>
            </div>

            {/* Macro Flow Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0e1626] border border-slate-800/80 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Weekly Maker-Time Reclaimed</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1">
                  14.2 <span className="text-xs font-normal text-slate-400">hrs/dev/week</span>
                </div>
                <span className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> +32.5% deep-work lift
                </span>
              </div>
              <div className="bg-[#0e1626] border border-slate-800/80 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Monthly Squad Deep Work</span>
                <div className="text-2xl font-bold text-white mt-1">966 hrs</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Across qualifying k &gt;= 5 squads</span>
              </div>
              <div className="bg-[#0e1626] border border-slate-800/80 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Deployment Frequency</span>
                <div className="text-2xl font-bold text-cyan-400 mt-1 flex items-baseline gap-1">
                  4.2 <span className="text-xs font-normal text-slate-400">deploys/week</span>
                </div>
                <span className="text-[11px] text-cyan-400/80 mt-1 block">DORA Elite tier standard</span>
              </div>
              <div className="bg-[#0e1626] border border-slate-800/80 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Change Failure Rate</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">3.8%</div>
                <span className="text-[11px] text-emerald-400/80 mt-1 block">-44% incidents vs last quarter</span>
              </div>
            </div>

            {/* Squads Reporting (k >= 5) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" /> Squad Delivery Telemetry (Enforced k &ge; 5 Privacy Rule)
                </h3>
                <span className="text-xs text-slate-400">Sub-teams &lt; 5 members rolled up to Parent Department</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Reporting Unit</th>
                      <th className="p-3">Engineers</th>
                      <th className="p-3">Talk-to-Ship Ratio</th>
                      <th className="p-3">Maker Capacity</th>
                      <th className="p-3">Lead Time</th>
                      <th className="p-3">MTTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {execPack?.squads?.map((sq: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/20">
                        <td className="p-3 font-medium text-white">{sq.reporting_unit_id}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{sq.total_engineers} devs</td>
                        <td className="p-3 text-slate-300">{sq.talk_to_ship_ratio} min/point</td>
                        <td className="p-3 text-emerald-300 font-medium">{sq.maker_time_capacity_pct}%</td>
                        <td className="p-3 text-slate-300">{sq.dora_metrics.lead_time_for_changes}</td>
                        <td className="p-3 text-slate-300">{sq.dora_metrics.mean_time_to_recovery}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT REQUIREMENT VOLATILITY (CRV) & CHANGE REQUEST GENERATOR */}
        {activeTab === "crv-scope" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Delivery Margin Protection</span>
                <h2 className="text-xl font-bold text-white mt-1">Client Requirement Volatility (CRV) &amp; Scope Drift Audit</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Flagged when client/PM verbal commitments diverge from locked Jira sprint acceptance criteria (Cosine Sim &lt; 0.65).
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Billed CRs Generated This Month</span>
                <div className="text-xl font-bold text-amber-400">₹1,88,000 INR</div>
              </div>
            </div>

            {/* Drift Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Active Scope Expansion Audit Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Detected Timestamp</th>
                      <th className="p-3">Verbal Call Commitment</th>
                      <th className="p-3">Closest Ticket</th>
                      <th className="p-3">Cosine Sim</th>
                      <th className="p-3">Effort Impact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {execPack?.scope_drift_events?.map((drift: any) => (
                      <tr key={drift.drift_id} className="hover:bg-slate-800/20">
                        <td className="p-3 text-slate-400 whitespace-nowrap">{drift.detected_at}</td>
                        <td className="p-3 text-slate-200 max-w-md font-medium">{drift.spoken_commitment}</td>
                        <td className="p-3 text-cyan-400 font-mono font-semibold">{drift.closest_ticket}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[11px] border border-red-500/30">
                            {drift.cosine_similarity.toFixed(2)} (Drift)
                          </span>
                        </td>
                        <td className="p-3 text-amber-400 font-semibold">{drift.estimated_story_points} pts (~{(drift.estimated_story_points * 8)} hrs)</td>
                        <td className="p-3">
                          {drift.status === "CONVERTED_TO_BILLED_CR" ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium text-[11px] border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" /> Billed CR Generated
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium text-[11px] border border-amber-500/30">
                              Flagged (Unbilled)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {drift.status === "FLAGGED" && (
                            <button
                              onClick={() => {
                                setSelectedDrift(drift);
                                handleConvertCR(drift.drift_id);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition-all"
                            >
                              Generate Billed CR
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generated CR Modal Notification */}
            {crGenerated && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Change Request Created: <span className="text-emerald-400 font-mono">{crGenerated.change_request_number}</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Billed Amount: <span className="font-bold text-white">₹{crGenerated.billed_amount_inr?.toLocaleString("en-IN")} INR</span> ({crGenerated.estimated_hours} hrs @ ₹1,500/hr). Invoice line item ready for client submission.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => alert(`CR Document ${crGenerated.change_request_number} exported for client signature.`)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  Download Signed CR (.pdf)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 90-DAY AUTO-KT & TRIBAL MEMORY PORTAL */}
        {activeTab === "auto-kt" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: ADRs & Commute Brief Audio Player */}
            <div className="md:col-span-2 space-y-6">
              {/* 90-Sec Commute Audio Brief Player */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      8:00 AM Commute Audio Flash Brief
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Duration: 01:28 (Replaces 45-min Standup)</span>
                </div>
                <p className="text-sm text-slate-200 font-medium">
                  &ldquo;Good morning Checkout Squad! In PR #412, Raghunath resolved the HDFC gateway timeout by fixing the 500ms webhook jitter. Vikram has a potential blocker on Kafka consumer thread pool for Sprint 42.&rdquo;
                </p>

                {/* Simulated Audio Player */}
                <div className="mt-4 flex items-center gap-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold transition-all"
                  >
                    <Play className="h-4 w-4 ml-0.5" />
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-emerald-400 rounded-full transition-all duration-300 ${isPlayingAudio ? "w-2/3" : "w-1/6"}`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{isPlayingAudio ? "00:58" : "00:14"}</span>
                      <span>01:28 (Neutral Neural Voice - DPDP Section 12 Anonymized)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Synthetic Architectural Decision Records (ADRs) */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-cyan-400" /> Synthetic ADR Knowledge Graph
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    DPDP Section 12 Safe: Biometrics Purged
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono text-cyan-400">services/settlement/PaymentReconciler.ts#reconcileBatch</span>
                      <span>PR #412 • Jira PAY-1082</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      ADR-2026-08: Retention of 500ms Delay in Settlement Webhook Retries
                    </h4>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      &ldquo;The HDFC settlement API silently drops webhook calls if concurrent retries are sent under 500ms spacing. While refactoring to an async queue was evaluated, bank partner API throttling mandates retaining this sleep parameter.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">Author: Lead Architect [Settlement]</span>
                      <span>•</span>
                      <span>Recorded on 2026-08-12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Virtual Predecessor Q&A Chat */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col h-[560px]">
              <div className="border-b border-slate-800 pb-3 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" /> Virtual Predecessor AI
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Trained on departing engineers&apos; architecture calls, PR diffs &amp; tickets.
                </p>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                      msg.sender === "user"
                        ? "ml-auto bg-emerald-500 text-slate-950 font-medium rounded-br-none"
                        : "mr-auto bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-bl-none"
                    }`}
                  >
                    {msg.role && (
                      <span className="text-[10px] font-semibold text-cyan-400 block mb-1">
                        {msg.role}
                      </span>
                    )}
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="p-3 bg-slate-800/80 text-slate-400 rounded-xl max-w-[80%] text-xs flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" /> Querying tribal memory graph...
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="Ask why code was written..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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

        {/* TAB 4: STAGE-1 REPO BACKFILL & ASYMMETRIC POD PRICING */}
        {activeTab === "backfill-pricing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: 180-Day GitHub Backfill Form */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">Stage-1 Zero-Binary Onboarding</span>
                <h3 className="text-lg font-bold text-white mt-1">180-Day GitHub PR Historical Backfill</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect any GitHub repo to extract merged PR discussions, ticket links, and architectural decisions into Tribal Memory in &lt;15 mins.
                </p>
              </div>

              <form onSubmit={handleRunBackfill} className="space-y-3">
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
                <button
                  type="submit"
                  disabled={backfillLoading}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-slate-950 font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 disabled:opacity-50"
                >
                  {backfillLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Mining 180 Days of PRs &amp; Jira Tickets...
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
                    <span>Backfill Complete: {backfillResult.repo}</span>
                    <span>{backfillResult.nodes_indexed} Nodes Created</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    {backfillResult.nodes?.map((n: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                        <span>PR #{n.pr_id} [{n.ticket_key || "TICKET"}]</span>
                        <span className="text-slate-400">{n.author_role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Asymmetric Pricing Calculator */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-5">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Indian Enterprise ROI Model</span>
                <h3 className="text-lg font-bold text-white mt-1">Asymmetric Pod Pricing Calculator</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Compare our tiered software investment vs. hiring an ₹11.08 LPA human Scrum Master.
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Contributor Seats (Devs @ ₹399/mo):</span>
                    <span className="font-bold text-emerald-400">{devCount} seats (₹{(devCount * 399).toLocaleString("en-IN")}/mo)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    value={devCount}
                    onChange={(e) => setDevCount(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Intelligence Seats (Leads/EMs/CTO @ ₹1,999/mo):</span>
                    <span className="font-bold text-cyan-400">{leadCount} seats (₹{(leadCount * 1999).toLocaleString("en-IN")}/mo)</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={leadCount}
                    onChange={(e) => setLeadCount(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Auto-KT Packs (Departing Engineers @ ₹9,999/event):</span>
                    <span className="font-bold text-purple-400">{ktEventCount} exits/year (₹{(ktEventCount * 9999).toLocaleString("en-IN")})</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={ktEventCount}
                    onChange={(e) => setKtEventCount(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* Totals & Comparison */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Total Annual WorkTree AI Contract:</span>
                  <span className="font-bold text-lg text-emerald-400">₹{totalAnnualSpend.toLocaleString("en-IN")} INR</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Hiring 1 Junior Scrum Master (Salary+PF+Recruiter):</span>
                  <span className="text-slate-300 font-semibold">₹{singleScrumMasterCost.toLocaleString("en-IN")} INR</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                  {costDiff >= 0
                    ? `✅ WorkTree AI costs ₹${costDiff.toLocaleString("en-IN")} LESS than hiring a single junior Scrum Master!`
                    : `Covers ${devCount + leadCount} engineers with full AI memory & flow governance.`}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
