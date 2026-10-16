import test from "node:test";
import assert from "node:assert/strict";
import {
  formatTribalMemoryMarkdown,
  MemoryCacheManager,
} from "../src/whisperer_hud.js";
import type { TribalMemoryCard } from "@worktree/protocol";

test("formatTribalMemoryMarkdown renders complete markdown card", () => {
  const card: TribalMemoryCard = {
    symbol_hash: "hash_reconciler_1",
    ast_symbol_path: "services/settlement/PaymentReconciler.ts#reconcileBatch",
    ticket_key: "PAY-1082",
    pr_number: 412,
    summary_rationale: "HDFC settlement API silently drops webhook calls if retries are not spaced by 500ms.",
    audio_clip_local_url: "worktree://audio/clip-412.opus",
    recorded_date: "2026-08-12",
    author_role_alias: "Lead Architect [Settlement]",
  };

  const md = formatTribalMemoryMarkdown(card);
  assert.ok(md.includes("WorkTree Tribal Memory"));
  assert.ok(md.includes("Lead Architect [Settlement]"));
  assert.ok(md.includes("HDFC settlement API"));
  assert.ok(md.includes("PR #412"));
  assert.ok(md.includes("Jira [PAY-1082]"));
  assert.ok(md.includes("worktree://audio/clip-412.opus"));
});

test("MemoryCacheManager retrieves cards by path prefix", () => {
  const cache = new MemoryCacheManager();
  const card: TribalMemoryCard = {
    symbol_hash: "hash1",
    ast_symbol_path: "services/settlement/PaymentReconciler.ts#reconcileBatch",
    ticket_key: "PAY-1082",
    pr_number: 412,
    summary_rationale: "Rationale 1",
    audio_clip_local_url: null,
    recorded_date: "2026-08-12",
    author_role_alias: "Lead Architect",
  };

  cache.set(card.ast_symbol_path, card);

  const found = cache.findByPathPrefix("services/settlement/PaymentReconciler.ts");
  assert.equal(found.length, 1);
  assert.equal(found[0].ticket_key, "PAY-1082");

  const notFound = cache.findByPathPrefix("services/auth/AuthService.ts");
  assert.equal(notFound.length, 0);
});
