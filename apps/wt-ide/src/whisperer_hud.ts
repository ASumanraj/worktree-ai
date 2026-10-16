import type { TribalMemoryCard } from "@worktree/protocol";

export function formatTribalMemoryMarkdown(card: TribalMemoryCard): string {
  const parts: string[] = [
    `### 💡 WorkTree Tribal Memory: \`${card.ast_symbol_path}\``,
    `*Recorded on ${card.recorded_date} by **${card.author_role_alias}***`,
    "",
    `> ${card.summary_rationale}`,
  ];

  if (card.audio_clip_local_url) {
    parts.push("", `▶ **[Play 45s Architectural Audio Snippet](${card.audio_clip_local_url})**`);
  }

  const linked: string[] = [];
  if (card.pr_number) {
    linked.push(`PR #${card.pr_number}`);
  }
  if (card.ticket_key) {
    linked.push(`Jira [${card.ticket_key}]`);
  }

  if (linked.length > 0) {
    parts.push("", `🔗 **Linked Context:** ${linked.join(" | ")}`);
  }

  return parts.join("\n");
}

export class MemoryCacheManager {
  private cache = new Map<string, TribalMemoryCard>();

  public set(symbolPath: string, card: TribalMemoryCard): void {
    this.cache.set(symbolPath, card);
  }

  public get(symbolPath: string): TribalMemoryCard | undefined {
    return this.cache.get(symbolPath);
  }

  public findByPathPrefix(filePath: string): TribalMemoryCard[] {
    const cleanPath = filePath.replace(/\\/g, "/");
    const matches: TribalMemoryCard[] = [];
    for (const [key, card] of this.cache.entries()) {
      if (key.startsWith(cleanPath) || card.ast_symbol_path.startsWith(cleanPath)) {
        matches.push(card);
      }
    }
    return matches;
  }

  public clear(): void {
    this.cache.clear();
  }
}
