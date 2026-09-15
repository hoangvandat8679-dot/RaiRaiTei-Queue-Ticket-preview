import type { AppState } from '../core/types';
import { createStore } from '../state/store';
import { I18n } from '../i18n/i18n';
import { renderApp } from './render';

export interface BootResult {
  mounted: boolean;
  state: AppState;
}

const bootedRoots = new WeakMap<HTMLElement, BootResult>();

export function requireApplicationRoot(document: Document): HTMLElement {
  const root = document.getElementById('app-root');
  if (!(root instanceof HTMLElement))
    throw new Error('V2 application root #app-root was not found.');
  return root;
}

export function boot(root: HTMLElement): BootResult {
  const existing = bootedRoots.get(root);
  if (existing) return { mounted: false, state: existing.state };

  const store = createStore();
  const i18n = new I18n();
  root.dataset.v2Booted = 'true';
  renderApp(root, store, i18n);
  const result = { mounted: true, state: store.getState() };
  bootedRoots.set(root, result);
  return result;
}
