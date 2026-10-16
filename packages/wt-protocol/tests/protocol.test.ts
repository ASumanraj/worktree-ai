import test from "node:test";
import assert from "node:assert/strict";
import { createHeartbeat, PROTOCOL_VERSION } from "../src/index.js";

test("createHeartbeat constructs valid v1.0 payload", () => {
  const hb = createHeartbeat({
    workspace_repo: "org/payment-service",
    branch_name: "fix/PROD-4029-hmac",
    inferred_ticket_key: "PROD-4029",
    active_ast_symbol: "services/settlement/PaymentReconciler.ts#reconcileBatch",
    reflog_delta: {
      hard_resets_24h: 3,
      stash_drops_24h: 1,
      commits_pushed_24h: 0,
    },
  });

  assert.equal(hb.protocol_version, PROTOCOL_VERSION);
  assert.equal(hb.event, "WORKTREE_CONTEXT_HEARTBEAT");
  assert.equal(hb.inferred_ticket_key, "PROD-4029");
  assert.equal(hb.reflog_delta.hard_resets_24h, 3);
  assert.ok(hb.timestamp_utc.length > 0);
});
