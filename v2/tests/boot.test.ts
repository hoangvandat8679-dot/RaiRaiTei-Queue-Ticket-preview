import { describe, expect, it } from 'vitest';

import { boot, requireApplicationRoot } from '../src/app/boot';

describe('V2 boot', () => {
  it('boots once when the application root exists', () => {
    document.body.innerHTML = '<main id="app-root"></main>';
    const root = requireApplicationRoot(document);

    expect(boot(root)).toEqual({ mounted: true });
    expect(root.dataset.v2Booted).toBe('true');
  });

  it('fails with a clear error when the root is missing', () => {
    document.body.replaceChildren();

    expect(() => requireApplicationRoot(document)).toThrow(
      'V2 application root #app-root was not found.',
    );
  });

  it('is idempotent when boot is called again for the same root', () => {
    document.body.innerHTML = '<main id="app-root"></main>';
    const root = requireApplicationRoot(document);

    expect(boot(root)).toEqual({ mounted: true });
    expect(boot(root)).toEqual({ mounted: false });
  });
});
