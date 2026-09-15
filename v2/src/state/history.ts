import { HISTORY_DEBOUNCE_MS, MAX_HISTORY_ENTRIES } from '../core/constants';
import type { HistoryEntry, TicketDesignState } from '../core/types';

export class DesignHistory {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private applying = false;
  constructor(initial: TicketDesignState) {
    this.undoStack.push({ at: Date.now(), snapshot: structuredClone(initial) });
  }
  schedule(snapshot: TicketDesignState): void {
    if (this.applying) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.capture(snapshot);
    }, HISTORY_DEBOUNCE_MS);
  }
  cancelScheduled(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
  capture(snapshot: TicketDesignState): void {
    if (this.applying && this.timer) return;
    const previous = this.undoStack.at(-1)?.snapshot;
    if (previous && JSON.stringify(previous) === JSON.stringify(snapshot)) return;
    this.undoStack.push({ at: Date.now(), snapshot: structuredClone(snapshot) });
    if (this.undoStack.length > MAX_HISTORY_ENTRIES) this.undoStack.shift();
    this.redoStack = [];
  }
  undo(current: TicketDesignState): TicketDesignState {
    if (this.undoStack.length < 2) return current;
    const active = this.undoStack.pop();
    if (active) this.redoStack.push(active);
    return structuredClone(this.undoStack.at(-1)?.snapshot ?? current);
  }
  redo(current: TicketDesignState): TicketDesignState {
    const next = this.redoStack.pop();
    if (!next) return current;
    this.undoStack.push(next);
    return structuredClone(next.snapshot);
  }
  clear(current: TicketDesignState): void {
    this.undoStack = [{ at: Date.now(), snapshot: structuredClone(current) }];
    this.redoStack = [];
  }
  setApplying(value: boolean): void {
    this.applying = value;
    if (value) this.cancelScheduled();
  }
  get canUndo(): boolean {
    return this.undoStack.length > 1;
  }
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
