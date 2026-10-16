export * from "./schema.js";

export function createHeartbeat(params: {
  workspace_repo: string;
  branch_name: string;
  inferred_ticket_key?: string | null;
  active_ast_symbol?: string | null;
  reflog_delta?: {
    hard_resets_24h?: number;
    stash_drops_24h?: number;
    commits_pushed_24h?: number;
  };
}): import("./schema.js").WorktreeContextHeartbeat {
  return {
    protocol_version: "1.0",
    event: "WORKTREE_CONTEXT_HEARTBEAT",
    timestamp_utc: new Date().toISOString(),
    workspace_repo: params.workspace_repo,
    branch_name: params.branch_name,
    inferred_ticket_key: params.inferred_ticket_key ?? null,
    active_ast_symbol: params.active_ast_symbol ?? null,
    reflog_delta: {
      hard_resets_24h: params.reflog_delta?.hard_resets_24h ?? (params.reflog_delta as any)?.resets_last_24h ?? 0,
      stash_drops_24h: params.reflog_delta?.stash_drops_24h ?? 0,
      commits_pushed_24h: params.reflog_delta?.commits_pushed_24h ?? (params.reflog_delta as any)?.commits_last_24h ?? 0,
    },
  };
}
