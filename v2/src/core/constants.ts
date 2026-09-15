export const MASTER_TICKET = Object.freeze({ widthPx: 723, heightPx: 1240 });
export const DEFAULT_CORE_MM = Object.freeze({ width: 44, height: 79 });
export const DEFAULT_CUT_MARGIN_MM = Object.freeze({ x: 1, y: 1 });
export const A4_MM = Object.freeze({ width: 210, height: 297, margin: 5 });
export const DUPLEX_HEADER_MM = 18;
export const PRINT_TARGET_DPI = 360;
export const PRINT_MAX_RASTER_SCALE = 3.75;
export const JPEG_QUALITY = 0.92;
export const NUMBER_SHRINK_FACTORS = Object.freeze({ one: 1, two: 0.72, threeOrMore: 0.55 });
export const MAX_TICKET_NUMBER = 5000;
export const MAX_HISTORY_ENTRIES = 50;
export const HISTORY_DEBOUNCE_MS = 350;
export const MAX_IMPORT_BYTES = 12 * 1024 * 1024;
export const MAX_IMAGE_DATA_URI_BYTES = Object.freeze({
  background: 6 * 1024 * 1024,
  mascot: 3 * 1024 * 1024,
});

export const COLOR_IDS = [
  'bg-color',
  'number-color',
  'number-bg-color',
  'number-border-color',
  'msg-color',
  'msg-stroke-c',
  'branch-color',
  'branch-bg',
  'branch-stroke-c',
] as const;
export type ColorId = (typeof COLOR_IDS)[number];

export const CONTROL_IDS = [
  'bg-opacity',
  'cut-margin-x',
  'cut-margin-y',
  'border-width',
  'dot-size-1',
  'dot-size-2',
  'dot-offset',
  'dot-density',
  'mascot-width',
  'mascot-y',
  'number-size',
  'number-offset-y',
  'frame-width',
  'frame-height',
  'frame-y',
  'number-border-width',
  'msg-size',
  'msg-y',
  'msg-stroke-w',
  'branch-size',
  'branch-y',
  'branch-width',
  'branch-pad-y',
  'branch-radius',
  'branch-stroke-w',
] as const;
export type ControlId = (typeof CONTROL_IDS)[number];
export type Language = 'jp' | 'vn';
export type TemplateId = 'standard' | 'spring';
export type Orientation = 'portrait' | 'landscape';
export type PrintMode = 'sequential' | 'custom';
export type ToggleId = 'background' | 'border' | 'mascot' | 'number' | 'message' | 'branch';

export const CONTROL_DEFINITIONS = Object.freeze({
  'bg-opacity': { unit: '', base: 0.2, limit: 0.2, min: 0, max: 1 },
  'cut-margin-x': { unit: 'mm', base: 1, limit: 1, min: 0, max: 10 },
  'cut-margin-y': { unit: 'mm', base: 1, limit: 1, min: 0, max: 10 },
  'border-width': { unit: 'mm', base: 2, limit: 1.5, min: 0.5, max: 10 },
  'dot-size-1': { unit: 'mm', base: 1.5, limit: 1.5, min: 0, max: 8 },
  'dot-size-2': { unit: 'mm', base: 1.2, limit: 1.2, min: 0, max: 8 },
  'dot-offset': { unit: 'mm', base: 0.3, limit: 0.3, min: 0, max: 10 },
  'dot-density': { unit: '', base: 68, limit: 20, min: 10, max: 100 },
  'mascot-width': { unit: '%', base: 61, limit: 39, min: 10, max: 100 },
  'mascot-y': { unit: 'mm', base: 0, limit: 20, min: -20, max: 150 },
  'number-size': { unit: 'pt', base: 100, limit: 90, min: 10, max: 250 },
  'number-offset-y': { unit: 'mm', base: 0, limit: 50, min: -100, max: 100 },
  'frame-width': { unit: 'mm', base: 39, limit: 20, min: 10, max: 150 },
  'frame-height': { unit: 'mm', base: 37.5, limit: 20, min: 10, max: 150 },
  'frame-y': { unit: 'mm', base: 21.5, limit: 20, min: 0, max: 200 },
  'number-border-width': { unit: 'mm', base: 1, limit: 1, min: 0, max: 5 },
  'msg-size': { unit: 'pt', base: 8, limit: 5, min: 3, max: 50 },
  'msg-y': { unit: 'mm', base: 6, limit: 6, min: 0, max: 150 },
  'msg-stroke-w': { unit: 'pt', base: 0, limit: 2, min: 0, max: 5 },
  'branch-size': { unit: 'pt', base: 6, limit: 3, min: 3, max: 50 },
  'branch-y': { unit: 'mm', base: 2.5, limit: 2.5, min: 0, max: 50 },
  'branch-width': { unit: '%', base: 90, limit: 10, min: 10, max: 100 },
  'branch-pad-y': { unit: 'mm', base: 0, limit: 3, min: 0, max: 10 },
  'branch-radius': { unit: 'mm', base: 3.2, limit: 3.2, min: 0, max: 10 },
  'branch-stroke-w': { unit: 'pt', base: 0, limit: 2, min: 0, max: 5 },
} as const);

export const SPRING_PRESET = Object.freeze({
  'bg-opacity': 1,
  'cut-margin-x': 0,
  'cut-margin-y': 0,
  'mascot-width': 67.4,
  'mascot-y': -1.3,
  'number-size': 108,
  'number-offset-y': 0.5,
  'frame-width': 40.87,
  'frame-height': 36.9,
  'frame-y': 21.6,
  'msg-size': 8,
  'msg-y': 7.7,
  'branch-size': 6,
  'branch-y': 2.8,
  'branch-width': 77,
  'branch-pad-y': 0.7,
  'branch-radius': 0,
} satisfies Partial<Record<ControlId, number>>);
const SPRING_BASES: Partial<Record<ControlId, number>> = SPRING_PRESET;

export function getControlBase(id: ControlId, template: TemplateId = 'standard'): number {
  const springValue = SPRING_BASES[id];
  return template === 'spring' && springValue !== undefined
    ? springValue
    : CONTROL_DEFINITIONS[id].base;
}

export const SPRING_LOCKED_CONTROLS = Object.freeze([
  'bg-opacity',
  'bg-color',
  'number-bg-color',
  'number-border-color',
  'number-border-width',
  'branch-bg',
  'branch-radius',
] as const);
