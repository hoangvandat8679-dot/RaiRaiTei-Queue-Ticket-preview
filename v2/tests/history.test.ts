import { describe, expect, it, vi } from 'vitest';
import { createStandardDesign } from '../src/core/defaults';
import { DesignHistory } from '../src/state/history';

describe('design history', () => {
  it('coalesces scheduled changes and does not create a new entry after undo', () => {
    vi.useFakeTimers();
    const initial = createStandardDesign();
    const history = new DesignHistory(initial);
    const changed = structuredClone(initial);
    changed.messageText = 'changed';

    history.schedule(changed);
    vi.advanceTimersByTime(350);
    expect(history.canUndo).toBe(true);

    history.setApplying(true);
    const restored = history.undo(changed);
    history.setApplying(false);
    expect(restored.messageText).toBe(initial.messageText);

    vi.advanceTimersByTime(350);
    expect(history.canRedo).toBe(true);
    vi.useRealTimers();
  });

  it('clears pending history capture explicitly', () => {
    vi.useFakeTimers();
    const history = new DesignHistory(createStandardDesign());
    history.schedule(createStandardDesign());
    history.cancelScheduled();
    vi.advanceTimersByTime(350);
    expect(history.canUndo).toBe(false);
    vi.useRealTimers();
  });
});
