import * as fs from "node:fs";
import * as path from "node:path";
import type { ReflogDelta } from "@worktree/protocol";

export interface GitContextInfo {
  repoName: string;
  branchName: string;
  ticketKey: string | null;
  reflogDelta: ReflogDelta;
}

export function extractTicketKey(branchName: string): string | null {
  const match = branchName.match(/([A-Z]{2,10}-\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

export function parseGitHead(dotGitPath: string): { branchName: string; ticketKey: string | null } {
  const headPath = path.join(dotGitPath, "HEAD");
  if (!fs.existsSync(headPath)) {
    return { branchName: "unknown", ticketKey: null };
  }

  const content = fs.readFileSync(headPath, "utf-8").trim();
  if (content.startsWith("ref: refs/heads/")) {
    const branchName = content.replace("ref: refs/heads/", "").trim();
    return { branchName, ticketKey: extractTicketKey(branchName) };
  }

  // Detached HEAD state
  return { branchName: content.slice(0, 8), ticketKey: null };
}

export function parseReflogDelta(dotGitPath: string, nowMs = Date.now()): ReflogDelta {
  const reflogPath = path.join(dotGitPath, "logs", "HEAD");
  if (!fs.existsSync(reflogPath)) {
    return { hard_resets_24h: 0, stash_drops_24h: 0, commits_pushed_24h: 0 };
  }

  const lines = fs.readFileSync(reflogPath, "utf-8").split("\n");
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const cutoff = (nowMs - ONE_DAY_MS) / 1000;

  let hard_resets_24h = 0;
  let stash_drops_24h = 0;
  let commits_pushed_24h = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Standard git reflog line format:
    // <hash> <hash> <committer_name> <<committer_email>> <timestamp> <tz> <tab> <action>: <message>
    const match = line.match(/>\s+(\d+)\s+[+-]\d+\t([^:]+):\s+(.*)/);
    if (!match) continue;

    const timestampSec = parseInt(match[1], 10);
    if (timestampSec < cutoff) continue;

    const action = match[2].toLowerCase();
    const message = match[3].toLowerCase();

    if (action.includes("reset") || message.includes("reset")) {
      hard_resets_24h++;
    } else if (action.includes("stash") || message.includes("stash")) {
      stash_drops_24h++;
    } else if (action.includes("commit")) {
      commits_pushed_24h++;
    }
  }

  return {
    hard_resets_24h,
    stash_drops_24h,
    commits_pushed_24h,
  };
}

export function getGitContext(workspaceRoot: string): GitContextInfo | null {
  const dotGitPath = path.join(workspaceRoot, ".git");
  if (!fs.existsSync(dotGitPath)) {
    return null;
  }

  const repoName = path.basename(workspaceRoot);
  const { branchName, ticketKey } = parseGitHead(dotGitPath);
  const reflogDelta = parseReflogDelta(dotGitPath);

  return {
    repoName,
    branchName,
    ticketKey,
    reflogDelta,
  };
}
