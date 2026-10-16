import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { getWorktreeDir } from "../storage/tier0_db.js";

export interface SystemMetrics {
  memoryLoadPct: number;
  freeRamMb: number;
  cpuLoadPct: number;
}

export interface SpoolItem {
  meetingId: string;
  filePath: string;
  durationSec: number;
  createdAt: Date;
  status: "SPOOLING" | "WAITING_FOR_IDLE" | "PROCESSING_LOCAL_ASR" | "DISPATCHED_TO_CLOUD" | "COMPLETED";
  starvationStartedAt?: Date;
}

export function sampleSystemMetrics(): SystemMetrics {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryLoadPct = (usedMem / totalMem) * 100;
  const freeRamMb = freeMem / (1024 * 1024);

  // Approximate CPU load from 1-min load average or load sample
  const cpus = os.cpus();
  const cpuLoadPct = Math.min(100, Math.max(5, (os.loadavg()[0] / (cpus.length || 1)) * 100));

  return {
    memoryLoadPct: Math.round(memoryLoadPct),
    freeRamMb: Math.round(freeRamMb),
    cpuLoadPct: Math.round(cpuLoadPct),
  };
}

export class SpoolerAndRAMGovernor {
  private queue: Map<string, SpoolItem> = new Map();
  private spoolDir: string;

  constructor(spoolDir?: string) {
    this.spoolDir = spoolDir || path.join(getWorktreeDir(), "spool");
    if (!fs.existsSync(this.spoolDir)) {
      fs.mkdirSync(this.spoolDir, { recursive: true });
    }
  }

  /**
   * INVARIANT 3: Stream Opus frames during call without invoking inference
   */
  public startSpool(meetingId: string): SpoolItem {
    const filePath = path.join(this.spoolDir, `${meetingId}.opus`);
    // Ensure spool file exists
    fs.writeFileSync(filePath, Buffer.alloc(0));

    const item: SpoolItem = {
      meetingId,
      filePath,
      durationSec: 0,
      createdAt: new Date(),
      status: "SPOOLING",
    };
    this.queue.set(meetingId, item);
    return item;
  }

  /**
   * Marks call ended and transitions to WAITING_FOR_IDLE
   */
  public finishSpool(meetingId: string, durationSec: number): SpoolItem | undefined {
    const item = this.queue.get(meetingId);
    if (!item) return undefined;

    item.durationSec = durationSec;
    item.status = "WAITING_FOR_IDLE";
    item.starvationStartedAt = new Date();
    return item;
  }

  /**
   * INVARIANT 3: Memory & CPU Governor
   * Execute local ASR only when memory_load_pct < 84% AND free_ram_mb > 2200 AND cpu_load_pct < 60%.
   */
  public canRunLocalASR(metrics: SystemMetrics = sampleSystemMetrics()): boolean {
    return (
      metrics.memoryLoadPct < 84 &&
      metrics.freeRamMb > 2200 &&
      metrics.cpuLoadPct < 60
    );
  }

  /**
   * Polls queue and returns items ready for local transcription or cloud escalation
   */
  public evaluateQueue(
    metrics: SystemMetrics = sampleSystemMetrics(),
    now: Date = new Date()
  ): { readyForLocal: SpoolItem[]; readyForCloud: SpoolItem[]; stillWaiting: SpoolItem[] } {
    const readyForLocal: SpoolItem[] = [];
    const readyForCloud: SpoolItem[] = [];
    const stillWaiting: SpoolItem[] = [];

    const isSystemIdle = this.canRunLocalASR(metrics);

    for (const item of this.queue.values()) {
      if (item.status !== "WAITING_FOR_IDLE") continue;

      if (isSystemIdle) {
        item.status = "PROCESSING_LOCAL_ASR";
        readyForLocal.push(item);
        continue;
      }

      // Check for 45-minute starvation
      const starvationMs = item.starvationStartedAt ? now.getTime() - item.starvationStartedAt.getTime() : 0;
      const isStarved = starvationMs >= 45 * 60 * 1000;

      if (isStarved) {
        item.status = "DISPATCHED_TO_CLOUD";
        readyForCloud.push(item);
      } else {
        stillWaiting.push(item);
      }
    }

    return { readyForLocal, readyForCloud, stillWaiting };
  }

  /**
   * Manual override: User clicked "Transcribe Immediately"
   */
  public forceCloudDispatch(meetingId: string): SpoolItem | undefined {
    const item = this.queue.get(meetingId);
    if (!item) return undefined;
    item.status = "DISPATCHED_TO_CLOUD";
    return item;
  }

  public getQueue(): SpoolItem[] {
    return Array.from(this.queue.values());
  }
}
