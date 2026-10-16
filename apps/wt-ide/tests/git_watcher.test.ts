import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { extractTicketKey, parseGitHead, parseReflogDelta } from "../src/git_watcher.js";

test("extractTicketKey extracts ticket key from branch names", () => {
  assert.equal(extractTicketKey("fix/PROD-4029-hmac"), "PROD-4029");
  assert.equal(extractTicketKey("feature/CORE-102_jwt"), "CORE-102");
  assert.equal(extractTicketKey("PAY-884-quickfix"), "PAY-884");
  assert.equal(extractTicketKey("main"), null);
});

test("parseGitHead reads branch name and ticket correctly", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wt-git-test-"));
  const dotGit = path.join(tmpDir, ".git");
  fs.mkdirSync(dotGit);

  fs.writeFileSync(path.join(dotGit, "HEAD"), "ref: refs/heads/feature/PROD-4029-payment-gateway\n");

  const result = parseGitHead(dotGit);
  assert.equal(result.branchName, "feature/PROD-4029-payment-gateway");
  assert.equal(result.ticketKey, "PROD-4029");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("parseReflogDelta detects resets and commits within 24h", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wt-reflog-test-"));
  const dotGit = path.join(tmpDir, ".git");
  const logsHeadDir = path.join(dotGit, "logs");
  fs.mkdirSync(logsHeadDir, { recursive: true });

  const nowSec = Math.floor(Date.now() / 1000);
  const recentTimestamp = nowSec - 3600; // 1 hour ago
  const oldTimestamp = nowSec - 100000; // > 24 hours ago

  const mockReflog = [
    `0000000 1111111 Vikram <vikram@company.com> ${oldTimestamp} +0530\treset: moving to HEAD~1`,
    `1111111 2222222 Vikram <vikram@company.com> ${recentTimestamp} +0530\treset: moving to HEAD~1`,
    `2222222 3333333 Vikram <vikram@company.com> ${recentTimestamp} +0530\tcommit: fix hmac signature`,
    `3333333 4444444 Vikram <vikram@company.com> ${recentTimestamp} +0530\treset: moving to HEAD~2`,
  ].join("\n");

  fs.writeFileSync(path.join(logsHeadDir, "HEAD"), mockReflog);

  const delta = parseReflogDelta(dotGit);
  // Only the 2 recent resets should be counted (the old reset was >24h ago)
  assert.equal(delta.hard_resets_24h, 2);
  assert.equal(delta.commits_pushed_24h, 1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
