import { describe, expect, it } from 'vitest';
import {
  calculateLayout,
  buildDuplexPrintPlan,
  getNumberShrinkFactor,
  getPdfRasterScale,
  parseCustomRange,
  ticketPhysicalDimensions,
} from '../src/ticket/geometry';

describe('ticket geometry', () => {
  it('parses validated custom ranges like V1', () => {
    expect(parseCustomRange('1-3; 2; 8; 5001; 5-4; x')).toEqual([1, 2, 3, 8]);
    expect(parseCustomRange('')).toEqual([]);
  });
  it('preserves standard physical dimensions and layout', () => {
    const dimensions = ticketPhysicalDimensions();
    expect(dimensions).toEqual({ coreWidthMm: 44, coreHeightMm: 79, marginXMm: 1, marginYMm: 1 });
    expect(calculateLayout(dimensions, true).totalPerPage).toBeGreaterThan(0);
  });
  it('mirrors each duplex row and preserves empty cells', () => {
    const layout = {
      bestCols: 3,
      bestRows: 1,
      totalPerPage: 3,
      orientation: 'portrait' as const,
      ticketW: 44,
      ticketH: 79,
    };
    const plan = buildDuplexPrintPlan([1, 2], layout);
    expect(plan.pages[1]?.cells.map((cell) => cell.ticket)).toEqual([null, 2, 1]);
  });
  it('keeps the required shrink and 360 DPI floor behavior', () => {
    expect(getNumberShrinkFactor('1')).toBe(1);
    expect(getNumberShrinkFactor('12')).toBe(0.72);
    expect(getNumberShrinkFactor('123')).toBe(0.55);
    expect(getPdfRasterScale(44)).toBe(1);
  });
});
