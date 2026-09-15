export interface BootResult {
  mounted: boolean;
}

export function boot(root: HTMLElement): BootResult {
  if (root.dataset.v2Booted === 'true') {
    return { mounted: false };
  }

  root.dataset.v2Booted = 'true';
  return { mounted: true };
}

export function requireApplicationRoot(document: Document): HTMLElement {
  const root = document.getElementById('app-root');

  if (!(root instanceof HTMLElement)) {
    throw new Error('V2 application root #app-root was not found.');
  }

  return root;
}
