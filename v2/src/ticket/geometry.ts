import {
  A4_MM,
  DEFAULT_CORE_MM,
  DEFAULT_CUT_MARGIN_MM,
  DUPLEX_HEADER_MM,
  MASTER_TICKET,
  MAX_TICKET_NUMBER,
  NUMBER_SHRINK_FACTORS,
  PRINT_MAX_RASTER_SCALE,
  PRINT_TARGET_DPI,
  CONTROL_DEFINITIONS,
} from '../core/constants';
import type {
  DuplexPrintPlan,
  LayoutConfig,
  NumberMetrics,
  PrintCell,
  PrintPage,
  TicketDimensions,
  TicketDesignState,
} from '../core/types';

export function parseCustomRange(input: string): number[] {
  if (!input.trim()) return [];
  const numbers = new Set<number>();
  for (const raw of input.split(';')) {
    const part = raw.trim();
    if (!part) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start >= 1 && start <= end && end <= MAX_TICKET_NUMBER)
        for (let n = start; n <= end; n += 1) numbers.add(n);
      continue;
    }
    if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= MAX_TICKET_NUMBER) numbers.add(n);
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

export function clampDimension(value: number, fallback: number): number {
  return Math.min(297, Math.max(1, Number.isFinite(value) ? value : fallback));
}
export function ticketPhysicalDimensions(design?: Partial<TicketDimensions>): TicketDimensions {
  return {
    coreWidthMm: clampDimension(
      design?.coreWidthMm ?? DEFAULT_CORE_MM.width,
      DEFAULT_CORE_MM.width,
    ),
    coreHeightMm: clampDimension(
      design?.coreHeightMm ?? DEFAULT_CORE_MM.height,
      DEFAULT_CORE_MM.height,
    ),
    marginXMm: Math.min(10, Math.max(0, design?.marginXMm ?? DEFAULT_CUT_MARGIN_MM.x)),
    marginYMm: Math.min(10, Math.max(0, design?.marginYMm ?? DEFAULT_CUT_MARGIN_MM.y)),
  };
}
export function resolvedTicketDimensions(design: TicketDesignState): TicketDimensions {
  const marginX = CONTROL_DEFINITIONS['cut-margin-x'].base + design.deltas['cut-margin-x'];
  const marginY = CONTROL_DEFINITIONS['cut-margin-y'].base + design.deltas['cut-margin-y'];
  return ticketPhysicalDimensions({
    coreWidthMm: design.dimensions.coreWidthMm,
    coreHeightMm: design.dimensions.coreHeightMm,
    marginXMm: marginX,
    marginYMm: marginY,
  });
}

export function calculateLayout(dimensions: TicketDimensions, duplex: boolean): LayoutConfig {
  const ticketW = dimensions.coreWidthMm + dimensions.marginXMm * 2;
  const ticketH = dimensions.coreHeightMm + dimensions.marginYMm * 2;
  const header = duplex ? DUPLEX_HEADER_MM : 0;
  const portrait = {
    cols: Math.floor((A4_MM.width - A4_MM.margin * 2) / ticketW),
    rows: Math.floor((A4_MM.height - A4_MM.margin * 2 - header) / ticketH),
    orientation: 'portrait' as const,
  };
  const landscape = {
    cols: Math.floor((A4_MM.height - A4_MM.margin * 2) / ticketW),
    rows: Math.floor((A4_MM.width - A4_MM.margin * 2 - header) / ticketH),
    orientation: 'landscape' as const,
  };
  const pTotal = portrait.cols * portrait.rows;
  const lTotal = landscape.cols * landscape.rows;
  const selected = lTotal > pTotal ? landscape : portrait;
  return {
    bestCols: selected.cols,
    bestRows: selected.rows,
    totalPerPage: selected.cols * selected.rows,
    orientation: selected.orientation,
    ticketW,
    ticketH,
  };
}
export function getPdfRasterScale(ticketWidthMm: number, ticketPx = MASTER_TICKET.widthPx): number {
  if (!ticketWidthMm || ticketWidthMm <= 0 || !ticketPx) return 1;
  return Math.max(
    1,
    Math.min(PRINT_MAX_RASTER_SCALE, (PRINT_TARGET_DPI * ticketWidthMm) / (25.4 * ticketPx)),
  );
}
export function getNumberShrinkFactor(text: string): number {
  return text.length >= 3
    ? NUMBER_SHRINK_FACTORS.threeOrMore
    : text.length === 2
      ? NUMBER_SHRINK_FACTORS.two
      : NUMBER_SHRINK_FACTORS.one;
}
export function buildPagePlan(tickets: number[], layout: LayoutConfig): PrintPage[] {
  const pages: PrintPage[] = [];
  for (let start = 0; start < tickets.length; start += layout.totalPerPage) {
    const cells: PrintCell[] = [];
    for (let index = 0; index < layout.totalPerPage; index += 1) {
      const absolute = start + index;
      cells.push({
        ticket: absolute < tickets.length ? (tickets[absolute] ?? null) : null,
        column: index % layout.bestCols,
        row: Math.floor(index / layout.bestCols),
      });
    }
    pages.push({ side: 'single', cells });
  }
  return pages;
}
export function buildDuplexPrintPlan(tickets: number[], layout: LayoutConfig): DuplexPrintPlan {
  const front = buildPagePlan(tickets, layout).map((page) => ({ ...page, side: 'front' as const }));
  const back = front.map((page) => ({
    side: 'back' as const,
    cells: page.cells
      .map((cell) => ({ ...cell, column: layout.bestCols - 1 - cell.column }))
      .sort((a, b) => a.row - b.row || a.column - b.column),
  }));
  return { pages: [...front, ...back] };
}
export function numberMetricsForCanvas(
  metrics: NumberMetrics,
  text: string,
  width: number,
  height: number,
): { font: string; x: number; y: number; color: string } {
  return {
    font: `${metrics.fontWeight} ${metrics.fontSizePx * getNumberShrinkFactor(text) * metrics.pixelRatio}px ${metrics.fontFamily}`,
    x: metrics.centerRatioX * width,
    y: metrics.centerRatioY * height,
    color: metrics.color,
  };
}
