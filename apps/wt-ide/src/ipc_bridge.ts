import * as net from "node:net";
import type { WorktreeContextHeartbeat } from "@worktree/protocol";

export interface IPCBridgeOptions {
  host?: string;
  port?: number;
  reconnectIntervalMs?: number;
}

export class IPCBridge {
  private client: net.Socket | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly reconnectIntervalMs: number;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isDisposed = false;

  constructor(options: IPCBridgeOptions = {}) {
    this.host = options.host || "127.0.0.1";
    this.port = options.port || 49152;
    this.reconnectIntervalMs = options.reconnectIntervalMs || 5000;
  }

  public connect(): void {
    if (this.isDisposed || this.client) return;

    this.client = new net.Socket();

    this.client.connect(this.port, this.host, () => {
      this.isConnected = true;
    });

    this.client.on("error", () => {
      // Daemon may not be running yet; fail silently and schedule reconnect
      this.isConnected = false;
      this.cleanupSocket();
      this.scheduleReconnect();
    });

    this.client.on("close", () => {
      this.isConnected = false;
      this.cleanupSocket();
      this.scheduleReconnect();
    });
  }

  public sendHeartbeat(heartbeat: WorktreeContextHeartbeat): boolean {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const payload = JSON.stringify(heartbeat) + "\n";
      return this.client.write(payload);
    } catch {
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.isDisposed || this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectIntervalMs);
  }

  private cleanupSocket(): void {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupSocket();
  }
}
