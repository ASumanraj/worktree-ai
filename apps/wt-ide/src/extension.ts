import * as vscode from "vscode";
import { getGitContext } from "./git_watcher.js";
import { ASTDwellTracker } from "./ast_tracker.js";
import { MemoryCacheManager, formatTribalMemoryMarkdown } from "./whisperer_hud.js";
import { IPCBridge } from "./ipc_bridge.js";
import { createHeartbeat } from "@worktree/protocol";

export function activate(context: vscode.ExtensionContext) {
  const memoryCache = new MemoryCacheManager();
  const dwellTracker = new ASTDwellTracker(4000);
  const ipcBridge = new IPCBridge();
  ipcBridge.connect();

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = "$(shield) WorkTree: Active";
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Hook workspace git context
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const rootPath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : null;

  function broadcastHeartbeat(activeSymbol: string | null = null) {
    if (!rootPath) return;
    const gitContext = getGitContext(rootPath);
    if (!gitContext) return;

    const heartbeat = createHeartbeat({
      workspace_repo: gitContext.repoName,
      branch_name: gitContext.branchName,
      inferred_ticket_key: gitContext.ticketKey,
      active_ast_symbol: activeSymbol,
      reflog_delta: gitContext.reflogDelta,
    });

    ipcBridge.sendHeartbeat(heartbeat);

    if (gitContext.ticketKey) {
      statusBar.text = `$(shield) WorkTree: [${gitContext.ticketKey}]`;
    }
  }

  // Periodic heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    broadcastHeartbeat();
  }, 30000);

  // Initial broadcast
  broadcastHeartbeat();

  // Track cursor movement for 4-second dwell
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const doc = e.textEditor.document;
      const pos = e.selections[0]?.active;
      if (!pos) return;

      dwellTracker.onCursorMove({
        filePath: doc.uri.fsPath,
        line: pos.line,
        character: pos.character,
      });
    })
  );

  dwellTracker.onDwell((event) => {
    broadcastHeartbeat(event.normalizedSymbol);
  });

  // Hover Provider for Tribal Memory HUD
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: "file" },
    {
      provideHover(document, position) {
        const filePath = document.uri.fsPath;
        const cards = memoryCache.findByPathPrefix(filePath);
        if (cards.length === 0) {
          return null;
        }

        const md = new vscode.MarkdownString(formatTribalMemoryMarkdown(cards[0]));
        md.isTrusted = true;
        return new vscode.Hover(md);
      },
    }
  );
  context.subscriptions.push(hoverProvider);

  context.subscriptions.push({
    dispose() {
      clearInterval(heartbeatInterval);
      dwellTracker.dispose();
      ipcBridge.dispose();
    },
  });
}

export function deactivate() {}
