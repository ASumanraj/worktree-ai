import test from "node:test";
import assert from "node:assert/strict";
import { ASTDwellTracker } from "../src/ast_tracker.js";

test("ASTDwellTracker fires after dwellThresholdMs debounce", async () => {
  const tracker = new ASTDwellTracker(50); // fast threshold for test
  let fired = false;
  let receivedSymbol = "";

  tracker.onDwell((event) => {
    fired = true;
    receivedSymbol = event.normalizedSymbol;
  });

  tracker.onCursorMove({
    filePath: "services/settlement/PaymentReconciler.ts",
    line: 141,
    character: 10,
    symbolName: "reconcileBatch",
  });

  assert.equal(fired, false);

  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.equal(fired, true);
  assert.equal(receivedSymbol, "services/settlement/PaymentReconciler.ts#reconcileBatch");

  tracker.dispose();
});
