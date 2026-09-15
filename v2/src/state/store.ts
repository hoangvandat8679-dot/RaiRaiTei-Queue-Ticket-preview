import type { Action, AppState, Store } from '../core/types';
import { createInitialState } from '../core/defaults';

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DESIGN':
      return { ...state, design: action.design };
    case 'UPDATE_DESIGN':
      return { ...state, design: { ...state.design, ...action.patch } };
    case 'SET_LANGUAGE':
      return { ...state, language: action.language };
    case 'SET_PRINT':
      return { ...state, print: action.print };
    default:
      return state;
  }
}
export function createStore(initial: AppState = createInitialState()): Store<AppState> {
  let state = initial;
  const listeners = new Set<(next: AppState, previous: AppState) => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = reduce(state, action);
      if (next === state) return;
      const previous = state;
      state = next;
      listeners.forEach((listener) => listener(state, previous));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
export { reduce };
