import { initTier0DB } from "./storage/tier0_db.js";
import { QuarantineEngine } from "./storage/quarantine.js";
import { FailClosedChannel2Guard } from "./consent_guard/index.js";
import { SpoolerAndRAMGovernor } from "./spooler/index.js";
import { VDIIPCServer } from "./ipc_server/index.js";

async function main() {
  console.log("==================================================");
  console.log("🛡️  WorkTree AI Desktop Edge Daemon (wt-daemon)");
  console.log("   - Invariant 1: Zero-Surveillance Law (No screenshots/keyloggers)");
  console.log("   - Invariant 2: 48-Hour Quarantine & Self-Resolution Wipe");
  console.log("   - Invariant 3: SpoolAndWaitForIdle Post-Call ASR");
  console.log("   - Invariant 4: FailClosedChannel2Guard (Ch1 Mic Only on External)");
  console.log("==================================================");

  const db = initTier0DB();
  const quarantine = new QuarantineEngine(db);
  const guard = new FailClosedChannel2Guard("worktree.ai");
  const spooler = new SpoolerAndRAMGovernor();
  const ipcServer = new VDIIPCServer(quarantine, guard, spooler, 49152, 49153);

  await ipcServer.start();
  console.log("🚀 Edge IPC Loopback Server listening on 127.0.0.1:49152 (TCP)");
  console.log("📊 Edge Telemetry Endpoint listening on http://127.0.0.1:49153/telemetry");
}

main().catch((err) => {
  console.error("Fatal error starting wt-daemon:", err);
  process.exit(1);
});
