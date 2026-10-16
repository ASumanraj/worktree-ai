import * as net from "node:net";
import * as http from "node:http";
import type { WorktreeContextHeartbeat } from "@worktree/protocol";
import { QuarantineEngine } from "../storage/quarantine.js";
import { FailClosedChannel2Guard, AudioCaptureMode } from "../consent_guard/index.js";
import { SpoolerAndRAMGovernor, sampleSystemMetrics } from "../spooler/index.js";

export interface EdgeTelemetryState {
  ideConnected: boolean;
  lastHeartbeatReceivedAt: string | null;
  activeRepo: string;
  activeBranch: string;
  inferredTicketKey: string;
  activeAstSymbol: string;
  resetsLast24h: number;
  commitsLast24h: number;
  audioCaptureMode: AudioCaptureMode;
  audioGuardReason: string;
  ramGovernor: {
    memoryLoadPct: number;
    freeRamMb: number;
    cpuLoadPct: number;
    canRunLocalASR: boolean;
  };
  spoolQueueCount: number;
  quarantinedCount: number;
}

export class VDIIPCServer {
  private tcpServer: net.Server | null = null;
  private httpServer: http.Server | null = null;
  private connectedSockets = new Set<net.Socket>();
  private state: EdgeTelemetryState = {
    ideConnected: false,
    lastHeartbeatReceivedAt: null,
    activeRepo: "none",
    activeBranch: "main",
    inferredTicketKey: "",
    activeAstSymbol: "",
    resetsLast24h: 0,
    commitsLast24h: 0,
    audioCaptureMode: "CH1_MIC_ONLY",
    audioGuardReason: "Fail-Closed: Standby mode",
    ramGovernor: {
      memoryLoadPct: 50,
      freeRamMb: 4000,
      cpuLoadPct: 20,
      canRunLocalASR: true,
    },
    spoolQueueCount: 0,
    quarantinedCount: 0,
  };

  constructor(
    private quarantine: QuarantineEngine,
    private guard: FailClosedChannel2Guard,
    private spooler: SpoolerAndRAMGovernor,
    private tcpPort = 49152,
    private httpPort = 49153
  ) {}

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 1. TCP Server for wt-ide (127.0.0.1:49152)
      this.tcpServer = net.createServer((socket) => {
        this.connectedSockets.add(socket);
        this.state.ideConnected = true;

        let buffer = "";
        socket.on("data", (chunk) => {
          buffer += chunk.toString("utf-8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const hb = JSON.parse(line) as WorktreeContextHeartbeat;
              this.handleHeartbeat(hb);
            } catch {
              // Ignore malformed lines
            }
          }
        });

        socket.on("close", () => {
          this.connectedSockets.delete(socket);
          this.state.ideConnected = this.connectedSockets.size > 0;
        });

        socket.on("error", () => {
          this.connectedSockets.delete(socket);
          this.state.ideConnected = this.connectedSockets.size > 0;
        });
      });

      this.tcpServer.on("error", (err) => {
        reject(err);
      });

      this.tcpServer.listen(this.tcpPort, "127.0.0.1", () => {
        // 2. HTTP Server for Telemetry Inspection (127.0.0.1:49153)
        this.httpServer = http.createServer((req, res) => {
          // Allow CORS from localhost wt-web and wt-cloud
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
          }

          if (req.url === "/telemetry" || req.url === "/status") {
            this.refreshState();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(this.state));
            return;
          }

          res.writeHead(404);
          res.end("Not Found");
        });

        this.httpServer.listen(this.httpPort, "127.0.0.1", () => {
          resolve();
        });
      });
    });
  }

  public handleHeartbeat(hb: WorktreeContextHeartbeat): void {
    this.state.lastHeartbeatReceivedAt = hb.timestamp_utc;
    this.state.activeRepo = hb.workspace_repo;
    this.state.activeBranch = hb.branch_name;
    this.state.inferredTicketKey = hb.inferred_ticket_key || "";
    this.state.activeAstSymbol = hb.active_ast_symbol || "";
    const resets = hb.reflog_delta?.hard_resets_24h ?? (hb.reflog_delta as any)?.resets_last_24h ?? 0;
    const commits = hb.reflog_delta?.commits_pushed_24h ?? (hb.reflog_delta as any)?.commits_last_24h ?? 0;

    this.state.resetsLast24h = resets;
    this.state.commitsLast24h = commits;

    // Check Invariant 2: 48-Hour Quarantine
    if (hb.inferred_ticket_key) {
      if (commits > 0) {
        // Self-resolution commit detected: Wipe friction quarantine!
        this.quarantine.handleCommitDetected(hb.inferred_ticket_key);
      } else if (resets >= 3) {
        // High friction detected: Place in local 48h quarantine
        this.quarantine.recordFriction(
          hb.inferred_ticket_key,
          hb.branch_name,
          hb.workspace_repo,
          resets,
          1
        );
      }
    }
  }

  public refreshState(): void {
    const metrics = sampleSystemMetrics();
    this.state.ramGovernor = {
      ...metrics,
      canRunLocalASR: this.spooler.canRunLocalASR(metrics),
    };
    this.state.spoolQueueCount = this.spooler.getQueue().length;
    this.state.quarantinedCount = this.quarantine.getActiveQuarantined().length;
  }

  public getState(): EdgeTelemetryState {
    this.refreshState();
    return this.state;
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const socket of this.connectedSockets) {
        socket.destroy();
      }
      this.connectedSockets.clear();

      if (this.httpServer) {
        if ("closeAllConnections" in this.httpServer) {
          (this.httpServer as any).closeAllConnections();
        }
        this.httpServer.close();
      }

      if (this.tcpServer) {
        if ("closeAllConnections" in this.tcpServer) {
          (this.tcpServer as any).closeAllConnections();
        }
        this.tcpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
