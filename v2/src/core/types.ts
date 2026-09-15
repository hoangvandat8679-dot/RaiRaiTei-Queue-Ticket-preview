import type {
  ControlId,
  Language,
  Orientation,
  PrintMode,
  TemplateId,
  ToggleId,
} from './constants';

export type FontWeight = 400 | 500 | 700 | 900;
export type FontStyle = 'normal' | 'italic';
export interface TicketDimensions {
  coreWidthMm: number;
  coreHeightMm: number;
  marginXMm: number;
  marginYMm: number;
}
export interface TypographySettings {
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  offsetY: number;
}
export interface ImageState {
  backgroundDataUri: string | null;
  mascotDataUri: string | null;
  mascotSource: 'default' | 'custom';
  removeWhiteBackground: boolean;
}
export interface TicketDesignState {
  template: TemplateId;
  dimensions: TicketDimensions;
  deltas: Record<ControlId, number>;
  colors: Record<string, string>;
  toggles: Record<ToggleId, boolean>;
  typography: {
    number: TypographySettings;
    message: TypographySettings;
    branch: TypographySettings & {
      width: number;
      padY: number;
      radius: number;
      backgroundColor: string;
    };
  };
  image: ImageState;
  messageText: string;
  branchName: string;
}
export interface PrintConfig {
  mode: PrintMode;
  quantity: number;
  customSpec: string;
  duplex: boolean;
}
export interface AppState {
  design: TicketDesignState;
  print: PrintConfig;
  language: Language;
}
export interface LayoutConfig {
  bestCols: number;
  bestRows: number;
  totalPerPage: number;
  orientation: Orientation;
  ticketW: number;
  ticketH: number;
}
export interface ControlDefinition {
  id: ControlId;
  unit: string;
  base: number;
  limit: number;
  min: number;
  max: number;
  step: number;
  affectsLayout: boolean;
}
export interface TemplateDefinition {
  id: TemplateId;
  cssClass: string;
  preset: Partial<Record<ControlId, number>>;
  lockedControls: readonly string[];
  assets: readonly string[];
}
export interface PrintCell {
  ticket: number | null;
  column: number;
  row: number;
}
export interface PrintPage {
  side: 'single' | 'front' | 'back';
  cells: PrintCell[];
}
export interface DuplexPrintPlan {
  pages: PrintPage[];
}
export interface PrintJob {
  tickets: number[];
  layout: LayoutConfig;
  print: PrintConfig;
  pixelRatio: number;
}
export interface HistoryEntry {
  at: number;
  snapshot: TicketDesignState;
}
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };
export interface ExportedCustomizationV1 {
  app: string;
  format: 'rairaitei-design';
  version: 1;
  savedAt?: string;
  template?: string;
  controls?: Record<string, unknown>;
  colors?: Record<string, unknown>;
  fonts?: Record<string, unknown>;
  toggles?: Record<string, unknown>;
  mascots?: Record<string, unknown>;
  mascotType?: unknown;
  backgroundImage?: unknown;
  mascotImage?: unknown;
}
export interface ExportedCustomizationV2 {
  app: 'RaiRaiTei Queue Ticket';
  format: 'rairaitei-design';
  version: 2;
  savedAt: string;
  design: TicketDesignState;
}
export interface StorageSchema {
  language: Language;
}
export interface NumberMetrics {
  pixelRatio: number;
  fontSizePx: number;
  fontWeight: string;
  fontFamily: string;
  color: string;
  centerRatioX: number;
  centerRatioY: number;
}
export interface Store<S> {
  getState(): S;
  dispatch(action: Action): void;
  subscribe(listener: (state: S, previous: S) => void): () => void;
}
export type Action =
  | { type: 'SET_DESIGN'; design: TicketDesignState }
  | { type: 'UPDATE_DESIGN'; patch: Partial<TicketDesignState> }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'SET_PRINT'; print: PrintConfig };
