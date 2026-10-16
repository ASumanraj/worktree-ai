import test from "node:test";
import assert from "node:assert/strict";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { SpoolerAndRAMGovernor } from "../src/spooler/index.js";

test("TASK-07 / Invariant 3: SpoolAndWaitForIdle Post-Call Queue & RAM Governor", () => {
  const tmpSpool = path.join(os.tmpdir(), `wt-spool-test-${Date.now()}`);
  const governor = new SpoolerAndRAMGovernor(tmpSpool);

  // 1. Live Call: Start spooling (never runs inference while live)
  const item = governor.startSpool("meet-alpha-123");
  assert.equal(item.status, "SPOOLING");
  assert.ok(fs.existsSync(item.filePath));

  // 2. Call Ends: Transition to WAITING_FOR_IDLE
  const finished = governor.finishSpool("meet-alpha-123", 1800);
  assert.equal(finished?.status, "WAITING_FOR_IDLE");

  // 3. RAM Governor test: Heavy memory load (88% memory or >60% CPU) -> MUST DEFER
  const highLoadMetrics = {
    memoryLoadPct: 89,
    freeRamMb: 1200,
    cpuLoadPct: 75,
  };
  assert.equal(governor.canRunLocalASR(highLoadMetrics), false, "Must not run local ASR during heavy memory/CPU load");

  const evalDuringHighLoad = governor.evaluateQueue(highLoadMetrics, new Date());
  assert.equal(evalDuringHighLoad.readyForLocal.length, 0, "Spool must remain in queue during starvation");
  assert.equal(evalDuringHighLoad.stillWaiting.length, 1);

  // 4. System Idles (<84% RAM, >2200MB free, <60% CPU) -> EXECUTES LOCAL ASR
  const idleMetrics = {
    memoryLoadPct: 62,
    freeRamMb: 4500,
    cpuLoadPct: 18,
  };
  assert.equal(governor.canRunLocalASR(idleMetrics), true, "Can run local ASR when system is idle");

  const evalDuringIdle = governor.evaluateQueue(idleMetrics, new Date());
  assert.equal(evalDuringIdle.readyForLocal.length, 1, "Idle system transitions spool to local ASR");
  assert.equal(evalDuringIdle.readyForLocal[0].status, "PROCESSING_LOCAL_ASR");

  // Cleanup tmp dir
  fs.rmSync(tmpSpool, { recursive: true, force: true });
});
