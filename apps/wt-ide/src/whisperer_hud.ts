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
      if (key.includes(cleanPath) || card.ast_symbol_path.includes(cleanPath) || cleanPath.includes(card.ast_symbol_path)) {
        matches.push(card);
      }
    }
    return matches;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export async function fetchRemoteTribalMemory(
  filePath: string,
  symbol?: string,
  baseUrl = (typeof process !== "undefined" && process.env?.WT_CLOUD_URL) || "http://localhost:8000"
): Promise<TribalMemoryCard | null> {
  try {
    const cleanPath = filePath.replace(/\\/g, "/");
    const fileName = cleanPath.split("/").pop() || cleanPath;
    const url = new URL(`${baseUrl}/api/v1/memory/lookup`);
    if (symbol) {
      url.searchParams.set("symbol", symbol);
    }
    url.searchParams.set("file", fileName);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const resp = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const cards = (await resp.json()) as TribalMemoryCard[];
      if (Array.isArray(cards) && cards.length > 0) {
        return cards[0];
      }
    }
  } catch {
    // Graceful offline fallback: wt-cloud not running
  }
  return null;
}
