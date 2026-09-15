import {
  CONTROL_DEFINITIONS,
  DEFAULT_CORE_MM,
  DEFAULT_CUT_MARGIN_MM,
  SPRING_LOCKED_CONTROLS,
} from './constants';
import type { AppState, TicketDesignState } from './types';

function createDeltas(): TicketDesignState['deltas'] {
  return Object.fromEntries(
    Object.keys(CONTROL_DEFINITIONS).map((id) => [id, 0]),
  ) as TicketDesignState['deltas'];
}
export function createStandardDesign(): TicketDesignState {
  return {
    template: 'standard',
    dimensions: {
      coreWidthMm: DEFAULT_CORE_MM.width,
      coreHeightMm: DEFAULT_CORE_MM.height,
      marginXMm: DEFAULT_CUT_MARGIN_MM.x,
      marginYMm: DEFAULT_CUT_MARGIN_MM.y,
    },
    deltas: createDeltas(),
    colors: {
      'bg-color': '#fcd116',
      'number-color': '#e60012',
      'number-bg-color': '#ffffff',
      'number-border-color': '#e60012',
      'msg-color': '#111111',
      'msg-stroke-c': '#ffffff',
      'branch-color': '#ffffff',
      'branch-bg': '#e60012',
      'branch-stroke-c': '#000000',
    },
    toggles: {
      background: true,
      border: true,
      mascot: true,
      number: true,
      message: true,
      branch: true,
    },
    typography: {
      number: {
        fontFamily: "'Impact', sans-serif",
        fontWeight: 900,
        fontStyle: 'normal',
        fontSize: 100,
        color: '#e60012',
        strokeColor: '#e60012',
        strokeWidth: 1,
        offsetY: 0,
      },
      message: {
        fontFamily: "'Noto Sans JP', sans-serif",
        fontWeight: 700,
        fontStyle: 'normal',
        fontSize: 8,
        color: '#111111',
        strokeColor: '#ffffff',
        strokeWidth: 0,
        offsetY: 6,
      },
      branch: {
        fontFamily: "'Noto Sans JP', sans-serif",
        fontWeight: 900,
        fontStyle: 'normal',
        fontSize: 6,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 0,
        offsetY: 2.5,
        width: 90,
        padY: 0,
        radius: 3.2,
        backgroundColor: '#e60012',
      },
    },
    image: {
      backgroundDataUri: null,
      mascotDataUri: null,
      mascotSource: 'default',
      removeWhiteBackground: true,
    },
    messageText:
      '現在、店内満席のため\n順番にご案内いたします。\n番号をお呼びするまで\nお待ちください。',
    branchName: '安佐南相田店',
  };
}
export function createInitialState(): AppState {
  return {
    design: createStandardDesign(),
    print: { mode: 'sequential', quantity: 30, customSpec: '', duplex: true },
    language: 'jp',
  };
}
export { SPRING_LOCKED_CONTROLS };
