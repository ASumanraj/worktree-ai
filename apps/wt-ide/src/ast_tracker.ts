export interface SymbolDwellEvent {
  filePath: string;
  normalizedSymbol: string;
  line: number;
  character: number;
  timestampMs: number;
}

export type DwellCallback = (event: SymbolDwellEvent) => void;

export class ASTDwellTracker {
  private timer: NodeJS.Timeout | null = null;
  private readonly dwellThresholdMs: number;
  private currentEvent: SymbolDwellEvent | null = null;
  private callback: DwellCallback | null = null;

  constructor(dwellThresholdMs = 4000) {
    this.dwellThresholdMs = dwellThresholdMs;
  }

  public onDwell(callback: DwellCallback): void {
    this.callback = callback;
  }

  public onCursorMove(params: {
    filePath: string;
    line: number;
    character: number;
    symbolName?: string | null;
  }): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const cleanPath = params.filePath.replace(/\\/g, "/");
    const normalizedSymbol = params.symbolName
      ? `${cleanPath}#${params.symbolName}`
      : `${cleanPath}:L${params.line + 1}`;

    this.currentEvent = {
      filePath: cleanPath,
      normalizedSymbol,
      line: params.line,
      character: params.character,
      timestampMs: Date.now(),
    };

    this.timer = setTimeout(() => {
      if (this.currentEvent && this.callback) {
        this.callback(this.currentEvent);
      }
    }, this.dwellThresholdMs);
  }

  public dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentEvent = null;
    this.callback = null;
  }
}
