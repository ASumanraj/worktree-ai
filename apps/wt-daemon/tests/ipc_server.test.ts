import test from "node:test";
import assert from "node:assert/strict";
import * as net from "node:net";
import { DatabaseSync } from "node:sqlite";
import { QuarantineEngine } from "../src/storage/quarantine.js";
import { FailClosedChannel2Guard } from "../src/consent_guard/index.js";
import { SpoolerAndRAMGovernor } from "../src/spooler/index.js";
import { VDIIPCServer } from "../src/ipc_server/index.js";
import { createHeartbeat } from "@worktree/protocol";

test("TASK-08: Host-to-Remote VDI / SSH Local Loopback IPC Server", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE local_friction_quarantine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_key TEXT NOT NULL UNIQUE,
      branch_name TEXT NOT NULL,
      workspace_repo TEXT NOT NULL,
      resets_count INTEGER DEFAULT 0,
      peer_huddles_count INTEGER DEFAULT 0,
      quarantined_at TEXT NOT NULL,
      grace_window_expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'QUARANTINED',
      unblock_prompt_shown INTEGER DEFAULT 0
    );
  `);

  const quarantine = new QuarantineEngine(db);
  const guard = new FailClosedChannel2Guard("worktree.ai");
  const spooler = new SpoolerAndRAMGovernor();

  // Bind to free test ports
  const testTcpPort = 49252;
  const testHttpPort = 49253;
  const server = new VDIIPCServer(quarantine, guard, spooler, testTcpPort, testHttpPort);

  await server.start();

  try {
    // 1. Client connects to TCP server
    const client = new net.Socket();
    await new Promise<void>((resolve) => {
      client.connect(testTcpPort, "127.0.0.1", () => resolve());
    });

    // 2. Stream a WorktreeContextHeartbeat payload
    const heartbeat = createHeartbeat({
      workspace_repo: "worktree-ai",
      branch_name: "feat/stage-2-edge",
      inferred_ticket_key: "WT-204",
      active_ast_symbol: "src/auth.ts::verifyToken",
      reflog_delta: {
        hard_resets_24h: 3,
        commits_pushed_24h: 0,
      },
    });

    client.write(JSON.stringify(heartbeat) + "\n");
    await new Promise((r) => setTimeout(r, 100));

    // 3. Query telemetry state
    const state = server.getState();
    assert.equal(state.ideConnected, true, "IDE must show connected");
    assert.equal(state.activeRepo, "worktree-ai");
    assert.equal(state.activeBranch, "feat/stage-2-edge");
    assert.equal(state.inferredTicketKey, "WT-204");
    assert.equal(state.activeAstSymbol, "src/auth.ts::verifyToken");
    assert.equal(state.resetsLast24h, 3);
    assert.equal(state.quarantinedCount, 1, "3 resets must place ticket in 48-hour local quarantine");

    // 4. Test HTTP telemetry endpoint (127.0.0.1:49253/telemetry)
    const resp = await fetch(`http://127.0.0.1:${testHttpPort}/telemetry`, {
      headers: { Connection: "close" },
    });
    assert.equal(resp.status, 200);
    const json = (await resp.json()) as any;
    assert.equal(json.activeBranch, "feat/stage-2-edge");

    client.destroy();
  } finally {
    await server.stop();
  }
});
